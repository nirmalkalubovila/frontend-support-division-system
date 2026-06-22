import type { Task, TaskStatus } from "@/api/services/project-management/task-service";
import type { UserInfo } from "@/types/global-types";

// ── Allowed transitions (state machine) ────────────────────────
// Every move NOT listed here is a hard block.
export const WORKFLOW_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  "To Do":       ["In Progress"],
  "In Progress": ["Review", "To Do"],
  "Review":      ["In Progress", "Done"],
  "Done":        ["In Progress"],   // re-open only
};

// ── Role gates ──────────────────────────────────────────────────
// Maps "From->To" to roles that may perform the move.
// Only "Review->Done" and "Done->In Progress" are restricted.
// All other transitions are open to every authenticated user.
export const ROLE_GATES: Record<string, string[]> = {
  "Review->Done":      ["super_admin", "manager", "senior_engineer", "engineer"],
  "Done->In Progress": ["super_admin", "manager", "senior_engineer"],
};

// ── Field requirements (SOFT warnings only, not hard blocks) ───
// Used only in the drawer UI to hint what's missing — never
// used to reject a drag-and-drop transition.
export interface FieldHint {
  field: keyof Task;
  check: (v: unknown) => boolean;
  message: string;
}

export const FIELD_HINTS: Partial<Record<TaskStatus, FieldHint[]>> = {
  "Review": [
    { field: "assignees", check: (v) => Array.isArray(v) && (v as unknown[]).length > 0, message: "Consider assigning this task before review." },
  ],
  "Done": [
    { field: "assignees", check: (v) => Array.isArray(v) && (v as unknown[]).length > 0, message: "Consider assigning this task before marking done." },
    { field: "endDate",   check: (v) => !!v, message: "Consider setting a due date before marking done." },
  ],
};

export interface ValidationResult {
  valid: boolean;
  reason: string | null;
  /** Non-blocking hints about missing fields (UI-only) */
  hints: string[];
}

/**
 * Validates a status transition.
 * Hard blocks: invalid transition path + role gate (only for restricted moves).
 * Soft hints: missing fields — returned but never block the move.
 */
export function validateTaskTransition(
  task: Task,
  toStatus: TaskStatus,
  userInfo: UserInfo | null
): ValidationResult {
  const fromStatus = task.status;

  if (fromStatus === toStatus) return { valid: true, reason: null, hints: [] };

  // 1. Check the transition is in the state machine
  const allowed = WORKFLOW_TRANSITIONS[fromStatus] ?? [];
  if (!allowed.includes(toStatus)) {
    return {
      valid: false,
      reason: `Cannot move from "${fromStatus}" to "${toStatus}". Allowed: ${allowed.join(", ") || "none"}.`,
      hints: [],
    };
  }

  // 2. Role gate — only enforced for explicitly restricted transitions
  //    AND only when userInfo is already loaded (avoid blocking during hydration)
  const key = `${fromStatus}->${toStatus}`;
  const restrictedRoles = ROLE_GATES[key];
  if (restrictedRoles && userInfo && !restrictedRoles.includes(userInfo.role)) {
    return {
      valid: false,
      reason: `Your role (${userInfo.role}) is not permitted to move tasks from "${fromStatus}" to "${toStatus}". Requires: ${restrictedRoles.join(", ")}.`,
      hints: [],
    };
  }

  // 3. Soft field hints (never block)
  const hints: string[] = [];
  for (const hint of FIELD_HINTS[toStatus] ?? []) {
    if (!hint.check(task[hint.field])) hints.push(hint.message);
  }

  return { valid: true, reason: null, hints };
}

/** Returns all statuses the current user can move this task to. */
export function getAllowedTargets(task: Task, userInfo: UserInfo | null): TaskStatus[] {
  return (WORKFLOW_TRANSITIONS[task.status] ?? []).filter((to) => {
    const { valid } = validateTaskTransition(task, to, userInfo);
    return valid;
  });
}
