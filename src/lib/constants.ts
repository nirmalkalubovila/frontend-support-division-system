// ──────────────────────────────────────────────────────────────
// Application Constants
// ──────────────────────────────────────────────────────────────

export const APP_NAME = "Your Company (Pvt) Ltd";
export const APP_SLOGAN = "Support Division System";
export const APP_VERSION = "1.0.0";

// API
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

// Auth
export const ACCESS_TOKEN_KEY = "accessToken";
export const REFRESH_TOKEN_KEY = "refreshToken";

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// Issue Statuses (matches backend state machine)
export const ISSUE_STATUSES = [
  "Backlog",
  "Assigned",
  "Planned Solution",
  "In Progress",
  "Testing",
  "On Hold",
  "Pending Client",
  "Resolved",
  "Closed",
  "Reopened",
] as const;

// Kanban column statuses (subset for board display)
export const KANBAN_COLUMNS = [
  "Backlog",
  "Assigned",
  "Planned Solution",
  "In Progress",
  "Testing",
  "Resolved",
] as const;

// Priority levels
export const PRIORITIES = ["Critical", "High", "Medium", "Low"] as const;

// Issue types
export const ISSUE_TYPES = [
  "Bug",
  "Feature Request",
  "Access Issue",
  "Data Correction",
  "Performance",
  "Consultation",
] as const;

// Project statuses
export const PROJECT_STATUSES = [
  "Active",
  "On Hold",
  "Completed",
  "Archived",
] as const;

// Contract types
export const CONTRACT_TYPES = [
  "Monthly Retainer",
  "Per-Incident",
  "Time & Material",
  "Fixed",
] as const;

// Carry-over policies
export const CARRY_OVER_POLICIES = [
  "None",
  "Carry Forward",
  "Expire at Month-End",
] as const;

// Work types for time tracking
export const WORK_TYPES = [
  "Investigation",
  "Development",
  "Testing",
  "Communication",
  "Documentation",
  "Deployment",
] as const;

// User roles (5-tier hierarchy)
export const USER_ROLES = [
  "super_admin",
  "manager",
  "senior_engineer",
  "engineer",
  "intern",
] as const;

export const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  manager: "Manager / PM",
  senior_engineer: "Senior Engineer",
  engineer: "Engineer / Developer",
  intern: "Intern",
};

// SLA defaults (in minutes)
export const SLA_DEFAULTS = {
  Critical: { firstResponse: 30, resolution: 240, escalation: 120 },
  High: { firstResponse: 120, resolution: 480, escalation: 480 },
  Medium: { firstResponse: 240, resolution: 4320, escalation: 2880 },
  Low: { firstResponse: 1440, resolution: 10080, escalation: 0 },
} as const;

// Sidebar navigation
export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/issues", label: "Issues", icon: "Ticket" },
  { href: "/projects", label: "Projects", icon: "FolderKanban" },
  { href: "/reports", label: "Reports", icon: "BarChart3" },
  { href: "/users", label: "Users", icon: "Users" },
  { href: "/system", label: "System", icon: "Settings" },
] as const;
