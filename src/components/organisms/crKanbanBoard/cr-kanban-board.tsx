"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Plus, Eye, Pencil, Trash2, Clock, Paperclip, AlertCircle, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useGetProjectCRs, useUpdateCR, type ChangeRequest, type CRStatus } from "@/api/services/project-management/cr-service";
import type { User } from "@/api/services/user-management/user-service";
import useSessionStore from "@/store/session-store";
import { useKanbanSocket } from "@/hooks/use-kanban-socket";

// ── Config ──────────────────────────────────────────────────────
export const CR_KANBAN_STATUSES: CRStatus[] = [
  "To Do", "In Progress", "Review", "Done",
];

const COL_CONFIG: Record<string, { dot: string; header: string; addBtn: string; card: string; badge: string }> = {
  "To Do":       { dot: "bg-blue-400",    header: "bg-blue-50 dark:bg-blue-900/20",        addBtn: "hover:bg-blue-100",    card: "border-blue-200 hover:border-blue-400",      badge: "bg-blue-50 text-blue-700 border-blue-200" },
  "In Progress": { dot: "bg-indigo-400",  header: "bg-indigo-50 dark:bg-indigo-900/20",    addBtn: "hover:bg-indigo-100",  card: "border-indigo-200 hover:border-indigo-400",  badge: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  "Review":      { dot: "bg-purple-400",  header: "bg-purple-50 dark:bg-purple-900/20",    addBtn: "hover:bg-purple-100",  card: "border-purple-200 hover:border-purple-400",  badge: "bg-purple-50 text-purple-700 border-purple-200" },
  "Done":        { dot: "bg-green-400",   header: "bg-green-50 dark:bg-green-900/20",      addBtn: "hover:bg-green-100",   card: "border-green-200 hover:border-green-400",    badge: "bg-green-50 text-green-700 border-green-200" },
};

const PRIORITY_DOT: Record<string, string> = {
  Critical: "bg-red-500", High: "bg-orange-500", Medium: "bg-yellow-400", Low: "bg-green-500",
};

function fmtDate(d?: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── CR Kanban Card ───────────────────────────────────────────────
interface CardProps {
  cr: ChangeRequest;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, cr: ChangeRequest) => void;
  onDragEnd: () => void;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canEdit: boolean;
}

function CRKanbanCard({ cr, isDragging, onDragStart, onDragEnd, onClick, onEdit, onDelete, canEdit }: CardProps) {
  const cfg = COL_CONFIG[cr.status] ?? COL_CONFIG["Draft"];
  const pmName = typeof cr.assignedProjectManager === "object" ? cr.assignedProjectManager?.name : null;
  const devCount = cr.assignedDevelopers?.length ?? 0;

  return (
    <div
      draggable={canEdit}
      onDragStart={(e) => canEdit && onDragStart(e, cr)}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`group relative bg-[var(--surface)] rounded-xl border ${cfg.card} p-3.5 space-y-2.5 transition-all select-none
        ${isDragging ? "opacity-40 scale-95 rotate-1 shadow-2xl" : "hover:shadow-md"}
        ${canEdit ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}`}
    >
      {/* Header row */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-mono text-[var(--text-tertiary)] mb-0.5">{cr.crNumber}</p>
          <p className="text-sm font-semibold text-[var(--text-primary)] leading-snug group-hover:text-[var(--primary)] transition-colors">{cr.title}</p>
        </div>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={(e) => e.stopPropagation()}>
          <button onClick={onClick} className="p-1 rounded hover:bg-[var(--surface-hover)] text-[var(--text-tertiary)] hover:text-[var(--primary)]"><Eye className="h-3 w-3" /></button>
          {canEdit && (
            <>
              <button onClick={onEdit} className="p-1 rounded hover:bg-[var(--surface-hover)] text-[var(--text-tertiary)] hover:text-[var(--primary)]"><Pencil className="h-3 w-3" /></button>
              <button onClick={onDelete} className="p-1 rounded hover:bg-[var(--surface-hover)] text-[var(--text-tertiary)] hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
            </>
          )}
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--background)] border border-[var(--border)] text-[var(--text-secondary)]">{cr.crType}</span>
        <span className={`text-[10px] font-semibold flex items-center gap-0.5`}>
          <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[cr.priority]}`} />
          <span className="text-[var(--text-secondary)]">{cr.priority}</span>
        </span>
        {cr.targetReleaseDate && (
          <span className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-0.5">
            <Clock className="h-2.5 w-2.5" />{fmtDate(cr.targetReleaseDate)}
          </span>
        )}
        {cr.attachments?.length > 0 && (
          <span className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-0.5"><Paperclip className="h-2.5 w-2.5" />{cr.attachments.length}</span>
        )}
      </div>

      {/* Team row */}
      {(pmName || devCount > 0) && (
        <div className="flex items-center gap-1.5">
          {pmName && (
            <div title={pmName} className="h-6 w-6 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] border-2 border-[var(--surface)] flex items-center justify-center text-white text-[9px] font-bold shrink-0">
              {pmName.charAt(0).toUpperCase()}
            </div>
          )}
          {cr.assignedDevelopers?.slice(0, 3).map((d) => {
            const name = typeof d === "object" ? d.name : "";
            if (!name) return null;
            return (
              <div key={typeof d === "object" ? d._id : d} title={name}
                className="h-6 w-6 rounded-full bg-[var(--border)] border-2 border-[var(--surface)] flex items-center justify-center text-[var(--text-secondary)] text-[9px] font-bold shrink-0">
                {name.charAt(0).toUpperCase()}
              </div>
            );
          })}
          {devCount > 3 && <span className="text-[10px] text-[var(--text-tertiary)]">+{devCount - 3}</span>}
        </div>
      )}

      {/* Task progress indicator */}
      {(cr.taskProgress?.total ?? 0) > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-0.5">
              <CheckSquare className="h-2.5 w-2.5" />
              {cr.taskProgress.done}/{cr.taskProgress.total} tasks
            </span>
            <span className="text-[10px] font-semibold text-[var(--primary)]">{cr.taskProgress.completionPercentage}%</span>
          </div>
          <div className="h-1 w-full rounded-full bg-[var(--surface-hover)] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[var(--primary)] to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${cr.taskProgress.completionPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Drag handle */}
      {canEdit && (
        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-0 group-hover:opacity-30 pointer-events-none">
          {[0, 1, 2].map((i) => <div key={i} className="w-1 h-1 rounded-full bg-[var(--text-tertiary)]" />)}
        </div>
      )}
    </div>
  );
}

// ── CR Kanban Column ─────────────────────────────────────────────
interface ColumnProps {
  status: CRStatus;
  crs: ChangeRequest[];
  dragOverStatus: CRStatus | null;
  draggingCR: ChangeRequest | null;
  onDragStart: (e: React.DragEvent, cr: ChangeRequest) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, status: CRStatus) => void;
  onDrop: (e: React.DragEvent, status: CRStatus) => void;
  onCRClick: (cr: ChangeRequest) => void;
  onEdit: (cr: ChangeRequest) => void;
  onDelete: (cr: ChangeRequest) => void;
  onAdd: (status: CRStatus) => void;
  canEdit: boolean;
  userInfo: any;
}

function CRKanbanColumn({
  status, crs, dragOverStatus, draggingCR,
  onDragStart, onDragEnd, onDragOver, onDrop,
  onCRClick, onEdit, onDelete, onAdd, canEdit, userInfo,
}: ColumnProps) {
  const cfg = COL_CONFIG[status] ?? COL_CONFIG["Draft"];
  const isOver = dragOverStatus === status;

  return (
    <div
      onDragOver={(e) => onDragOver(e, status)}
      onDrop={(e) => onDrop(e, status)}
      className={`flex flex-col rounded-xl border transition-all duration-200 min-h-[480px] ${
        isOver
          ? "border-[var(--primary)] shadow-lg shadow-[var(--primary)]/10 bg-[rgba(99,102,241,0.03)]"
          : "border-[var(--border)] bg-[var(--background)]"
      }`}
    >
      {/* Column header */}
      <div className={`px-3 pt-3 pb-2 rounded-t-xl ${cfg.header}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
            <span className="text-xs font-bold text-[var(--text-primary)]">{status}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${cfg.badge}`}>{crs.length}</span>
            {canEdit && (
              <button onClick={() => onAdd(status)} className={`h-6 w-6 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--primary)] ${cfg.addBtn} transition-colors`}>
                <Plus className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {isOver && draggingCR && <div className="mx-3 mt-2 h-1.5 rounded-full bg-[var(--primary)] opacity-60 animate-pulse" />}

      {/* Cards */}
      <div className="flex-1 px-3 py-2 space-y-2.5 overflow-y-auto min-h-[120px]">
        {crs.length === 0 && !isOver ? (
          <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-[var(--border)] rounded-xl">
            <AlertCircle className="h-5 w-5 text-[var(--text-tertiary)] mb-1.5" />
            <p className="text-xs text-[var(--text-tertiary)] font-medium">No CRs</p>
            {canEdit && (
              <button onClick={() => onAdd(status)} className="mt-2 text-xs text-[var(--primary)] font-semibold hover:underline flex items-center gap-1">
                <Plus className="h-3 w-3" /> Add CR
              </button>
            )}
          </div>
        ) : (
          crs.map((cr) => {
            const hasCardEditAccess = userInfo ? (
              ["super_admin", "manager", "senior_engineer"].includes(userInfo.role) ||
              cr.assignedDevelopers?.some((d) => (typeof d === "object" ? d._id : d) === userInfo._id)
            ) : false;
            return (
              <CRKanbanCard
                key={cr._id}
                cr={cr}
                isDragging={draggingCR?._id === cr._id}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onClick={() => onCRClick(cr)}
                onEdit={() => onEdit(cr)}
                onDelete={() => onDelete(cr)}
                canEdit={hasCardEditAccess}
              />
            );
          })
        )}
        {isOver && draggingCR && (
          <div className="h-16 rounded-xl border-2 border-dashed border-[var(--primary)] bg-[rgba(99,102,241,0.05)] flex items-center justify-center">
            <span className="text-xs font-semibold text-[var(--primary)]">Drop here</span>
          </div>
        )}
      </div>

      {canEdit && crs.length > 0 && (
        <button onClick={() => onAdd(status)} className={`mx-3 mb-3 mt-1 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--primary)] hover:border-[var(--primary)] ${cfg.addBtn} transition-all`}>
          <Plus className="h-3.5 w-3.5" /> Add CR
        </button>
      )}
    </div>
  );
}

// ── Main CRKanbanBoard Export ────────────────────────────────────
interface CRKanbanBoardProps {
  projectId: string;
  members: User[];
  onCRClick: (cr: ChangeRequest) => void;
  onEdit: (cr: ChangeRequest) => void;
  onDelete: (cr: ChangeRequest) => void;
  onAdd: (defaultStatus?: CRStatus) => void;
}

export function CRKanbanBoard({ projectId, members, onCRClick, onEdit, onDelete, onAdd }: CRKanbanBoardProps) {
  const { data, isLoading } = useGetProjectCRs(projectId);
  const updateMutation = useUpdateCR(projectId);
  const userInfo = useSessionStore((s) => s.userInfo);
  const canEdit = userInfo ? ["super_admin", "manager", "senior_engineer", "engineer"].includes(userInfo.role) : false;

  // ── Real-time socket ──────────────────────────────────────────
  const { connected } = useKanbanSocket(projectId);

  const [draggingCR, setDraggingCR] = useState<ChangeRequest | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<CRStatus | null>(null);

  const crs = data?.data ?? [];

  const crsByStatus = useMemo(() => {
    const map = Object.fromEntries(CR_KANBAN_STATUSES.map((s) => [s, [] as ChangeRequest[]])) as Record<CRStatus, ChangeRequest[]>;
    crs.forEach((c) => { if (map[c.status]) map[c.status].push(c); });
    return map;
  }, [crs]);

  const handleDragStart = useCallback((e: React.DragEvent, cr: ChangeRequest) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("crId", cr._id);
    setDraggingCR(cr);
  }, []);

  const handleDragEnd = useCallback(() => { setDraggingCR(null); setDragOverStatus(null); }, []);

  const handleDragOver = useCallback((e: React.DragEvent, status: CRStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStatus(status);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, targetStatus: CRStatus) => {
    e.preventDefault();
    setDragOverStatus(null);
    if (!draggingCR || draggingCR.status === targetStatus) { setDraggingCR(null); return; }
    try {
      await updateMutation.mutateAsync({ crId: draggingCR._id, data: { status: targetStatus } });
      toast.success(`CR moved to ${targetStatus}`);
    } catch { toast.error("Failed to move CR"); }
    setDraggingCR(null);
  }, [draggingCR, updateMutation]);

  if (isLoading) {
    return (
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${CR_KANBAN_STATUSES.length}, minmax(0, 1fr))` }}>
        {CR_KANBAN_STATUSES.map((s) => <div key={s} className="rounded-xl bg-[var(--surface)] border border-[var(--border)] h-48 animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Board */}
      <div className="overflow-x-auto pb-4">
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${CR_KANBAN_STATUSES.length}, minmax(0, 1fr))` }}>
          {CR_KANBAN_STATUSES.map((status) => (
            <CRKanbanColumn
              key={status}
              status={status}
              crs={crsByStatus[status]}
              dragOverStatus={dragOverStatus}
              draggingCR={draggingCR}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onCRClick={onCRClick}
              onEdit={onEdit}
              onDelete={onDelete}
              onAdd={onAdd}
              canEdit={canEdit}
              userInfo={userInfo}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
