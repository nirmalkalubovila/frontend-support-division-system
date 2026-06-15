"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import type { Task } from "@/api/services/project-management/task-service";
import useSessionStore from "@/store/session-store";

// Derive socket URL from the API base — strip /api/v1 suffix
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

    const QUERY_KEY = ["/tasks", projectId];

    socket.on("task:created", (task: Task) => {
      qc.setQueryData<Task[]>(QUERY_KEY, (prev = []) => {
        if (prev.some((t) => t._id === task._id)) return prev;
        return [...prev, task];
      });
    });

    socket.on("task:updated", (task: Task) => {
      qc.setQueryData<Task[]>(QUERY_KEY, (prev = []) =>
        prev.map((t) => (t._id === task._id ? task : t))
      );
    });

    socket.on("task:deleted", ({ _id }: { _id: string }) => {
      qc.setQueryData<Task[]>(QUERY_KEY, (prev = []) =>
        prev.filter((t) => t._id !== _id)
      );
    });

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.emit("leave:project", projectId);
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [projectId, accessToken, qc]);

  return { socketRef, connected };
}
