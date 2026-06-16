"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import type { Issue } from "@/api/services/issue-management/issue-service";
import type { PaginateResult } from "@/types/global-types";
import useSessionStore from "@/store/session-store";

const SOCKET_URL = (() => {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
  return base.replace(/\/api\/v1\/?$/, "");
})();

/**
 * Joins socket rooms for all provided projectIds and patches the
 * ["/issues", params] cache in-place — no refetch, instant board updates.
 */
export function useIssuesSocket(projectIds: string[]) {
  const qc = useQueryClient();
  const accessToken = useSessionStore((s) => s.accessToken);
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!accessToken || projectIds.length === 0) return;

    const socket = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
    });

    socketRef.current = socket;

    const onConnect = () => {
      setConnected(true);
      projectIds.forEach((id) => socket.emit("join:project", id));
    };
    const onDisconnect = () => setConnected(false);
    const onConnectError = () => setConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);

    // Patch every cached ["/issues", params] entry that is a PaginateResult
    const patchAll = (updater: (prev: PaginateResult<Issue>) => PaginateResult<Issue>) => {
      qc.setQueriesData<PaginateResult<Issue>>(
        { queryKey: ["/issues"], exact: false },
        (prev) => (prev ? updater(prev) : prev)
      );
    };

    socket.on("issue:created", (issue: Issue) => {
      patchAll((prev) => {
        if (prev.data.some((i) => i._id === issue._id)) return prev;
        return { ...prev, data: [issue, ...prev.data], totalResults: prev.totalResults + 1 };
      });
    });

    socket.on("issue:updated", (issue: Issue) => {
      patchAll((prev) => ({
        ...prev,
        data: prev.data.map((i) => (i._id === issue._id ? issue : i)),
      }));
      // Also patch single-issue cache entry if open in detail modal
      qc.setQueryData<Issue>(["/issues", issue._id], issue);
    });

    socket.on("issue:deleted", ({ _id }: { _id: string }) => {
      patchAll((prev) => ({
        ...prev,
        data: prev.data.filter((i) => i._id !== _id),
        totalResults: Math.max(0, prev.totalResults - 1),
      }));
    });

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("issue:created");
      socket.off("issue:updated");
      socket.off("issue:deleted");
      projectIds.forEach((id) => socket.emit("leave:project", id));
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
    // Re-run only when the stringified list or token changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectIds.join(","), accessToken]);

  return { socketRef, connected };
}
