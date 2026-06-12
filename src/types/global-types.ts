// ──────────────────────────────────────────────────────────────
// Global Type Definitions
// ──────────────────────────────────────────────────────────────

/** Base interface for all backend entities */
export interface GlobalRecords {
  _id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/** Standard paginated API response */
export interface PaginateResult<T> {
  data: T[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

/** Standard pagination request params */
export interface PaginationRequest {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/** API error response shape */
export interface ApiErrorResponse {
  code: number;
  message: string;
  stack?: string;
}

/** User role types */
export type UserRole =
  | "super_admin"
  | "manager"
  | "senior_engineer"
  | "engineer"
  | "intern";

/** Auth tokens */
export interface AuthTokens {
  access: {
    token: string;
    expires: string;
  };
  refresh: {
    token: string;
    expires: string;
  };
}

/** Login response */
export interface LoginResponse {
  user: UserInfo;
  tokens: AuthTokens;
}

/** Current user info (from /auth/me) */
export interface UserInfo {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: string[];
  avatar?: string;
  phone?: string;
  designation?: string;
  isActive: boolean;
  createdAt: string;
}

/** Select option for dropdowns */
export interface SelectOption {
  label: string;
  value: string;
}

/** Issue / Ticket workflow statuses */
export type IssueStatus =
  | "backlog"
  | "assigned"
  | "planned"
  | "in_progress"
  | "testing"
  | "on_hold"
  | "pending_client"
  | "resolved"
  | "closed"
  | "reopened";

