"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import type { Task } from "@/api/services/project-management/task-service";
import type { ChangeRequest } from "@/api/services/project-management/cr-service";
import type { Issue } from "@/api/services/issue-management/issue-service";
import useSessionStore from "@/store/session-store";

const SOCKET_URL = (() => {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
  return base.replace(/\/api\/v1\/?$/, "");
})();

export function useKanbanSocket(projectId: string) {
  const qc = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const accessToken = useSessionStore((s) => s.accessToken);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!projectId || !accessToken) return;

    const socket = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
    });

    socketRef.current = socket;

    const onConnect = () => {
      setConnected(true);
      socket.emit("join:project", projectId);
    };
    const onDisconnect = () => setConnected(false);
    const onConnectError = () => setConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);

    // ── Task events ─────────────────────────────────────────────
    const TASK_KEY = ["/tasks", projectId];

    socket.on("task:created", (task: Task) => {
      qc.setQueryData<Task[]>(TASK_KEY, (prev = []) =>
        prev.some((t) => t._id === task._id) ? prev : [...prev, task]
      );
    });
    socket.on("task:updated", (task: Task) => {
      qc.setQueryData<Task[]>(TASK_KEY, (prev = []) =>
        prev.map((t) => (t._id === task._id ? task : t))
      );
    });
    socket.on("task:deleted", ({ _id }: { _id: string }) => {
      qc.setQueryData<Task[]>(TASK_KEY, (prev = []) =>
        prev.filter((t) => t._id !== _id)
      );
    });

    // ── CR events ────────────────────────────────────────────────
    // CR query key includes a params object as 3rd element; we match
    // all cache entries whose key starts with ["/crs", projectId]
    const patchCRCache = (updater: (prev: { data: ChangeRequest[]; totalResults: number }) => { data: ChangeRequest[]; totalResults: number }) => {
      qc.setQueriesData<{ data: ChangeRequest[]; totalResults: number }>(
        { queryKey: ["/crs", projectId], exact: false },
        (prev) => prev ? updater(prev) : prev
      );
    };

    socket.on("cr:created", (cr: ChangeRequest) => {
      patchCRCache((prev) => ({
        ...prev,
        data: prev.data.some((c) => c._id === cr._id) ? prev.data : [...prev.data, cr],
        totalResults: prev.data.some((c) => c._id === cr._id) ? prev.totalResults : prev.totalResults + 1,
      }));
      // Also invalidate stats
      qc.invalidateQueries({ queryKey: ["/crs/stats", projectId] });
    });
    socket.on("cr:updated", (cr: ChangeRequest) => {
      patchCRCache((prev) => ({
        ...prev,
        data: prev.data.map((c) => (c._id === cr._id ? cr : c)),
      }));
      qc.invalidateQueries({ queryKey: ["/crs/stats", projectId] });
    });
    socket.on("cr:deleted", ({ _id }: { _id: string }) => {
      patchCRCache((prev) => ({
        ...prev,
        data: prev.data.filter((c) => c._id !== _id),
        totalResults: Math.max(0, prev.totalResults - 1),
      }));
      qc.invalidateQueries({ queryKey: ["/crs/stats", projectId] });
    });

    // ── Issue events ─────────────────────────────────────────────
    // Issues are cached under ["/issues", params] where params.project === projectId.
    // We invalidate all issue queries that reference this project — the cleanest
    // approach since issue queries can have many filter param combinations.
    const invalidateIssues = () => {
      qc.invalidateQueries({
        queryKey: ["/issues"],
        predicate: (query) => {
          const key = query.queryKey as unknown[];
          if (key[0] !== "/issues") return false;
          const params = key[1] as Record<string, unknown> | undefined;
          return !params || params.project === projectId || params.project === undefined;
        },
      });
    };

    socket.on("issue:created", invalidateIssues);
    socket.on("issue:updated", invalidateIssues);
    socket.on("issue:deleted", invalidateIssues);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("task:created");
      socket.off("task:updated");
      socket.off("task:deleted");
      socket.off("cr:created");
      socket.off("cr:updated");
      socket.off("cr:deleted");
      socket.off("issue:created");
      socket.off("issue:updated");
      socket.off("issue:deleted");
      socket.emit("leave:project", projectId);
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [projectId, accessToken, qc]);

  return { socketRef, connected };
}
