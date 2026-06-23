import type { GlobalRecords } from "@/types/global-types";
import type { Project } from "@/api/services/project-management/project-service";
import type { Payment } from "@/types/finance-types";

// ─────────────────────────────────────────────────────────────
// Baseline Types
// ─────────────────────────────────────────────────────────────

export interface UomType {
  _id: string;
  name: string;
  description: string | null;
  defaultCount: number;
  baselinePrice: number;
  currency: string;
  unit: string | null;
  isActive: boolean;
  order: number;
}

export interface PricingVersion {
  _id: string;
  uomTypeId: string;
  uomTypeName: string;
  pricePerUnit: number;
  currency: string;
  effectiveFrom: string; // "YYYY-MM"
  effectiveTo: string | null; // "YYYY-MM" or null
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BaselineAudit {
  _id: string;
  action: "created" | "updated" | "uom_type_added" | "uom_type_removed" | "uom_type_updated" | "price_updated";
  changedBy: string | null;
  changes: Record<string, unknown> | null;
  notes: string | null;
  createdAt: string;
}

export interface UomBaseline extends GlobalRecords {
  project: string | Project;
  uomTypes: UomType[];
  pricingVersions: PricingVersion[];
  auditLog: BaselineAudit[];
  isConfigured: boolean;
  createdBy: string | null;
  updatedBy: string | null;
}

// ─────────────────────────────────────────────────────────────
// Snapshot Types
// ─────────────────────────────────────────────────────────────

export interface SnapshotLine {
  _id: string;
  uomTypeId: string;
  name: string;
  description: string | null;
  count: number;
  previousCount: number | null;
  pricePerUnit: number;
  currency: string;
  unit: string | null;
  lineTotal: number;
  isManuallyEdited: boolean;
  pricingVersionId: string | null;
  order: number;
}

export interface SnapshotOverride {
  _id: string;
  uomTypeId: string;
  uomTypeName: string;
  previousCount: number;
  newCount: number;
  previousPricePerUnit: number;
  newPricePerUnit: number;
  reason: string;
  approvedBy: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface SnapshotAudit {
  _id: string;
  action: "generated" | "count_updated" | "finalized" | "unlocked" | "override_added" | "payment_linked" | "payment_created" | "payment_voided";
  changedBy: string | null;
  changes: Record<string, unknown> | null;
  notes: string | null;
  createdAt: string;
}

export type SnapshotStatus = "draft" | "finalized";

export interface UomSnapshot extends GlobalRecords {
  project: string | Project;
  baseline: string | UomBaseline;
  billingMonth: string; // "YYYY-MM"
  snapshotId: string;
  status: SnapshotStatus;
  lines: SnapshotLine[];
  grandTotal: number;
  currency: string;
  seededFromPrevious: boolean;
  finalizedAt: string | null;
  finalizedBy: string | null;
  linkedPayment: string | Payment | null;
  overrides: SnapshotOverride[];
  auditLog: SnapshotAudit[];
  notes: string | null;
  createdBy: string | null;
}

// ─────────────────────────────────────────────────────────────
// Request Payload Types
// ─────────────────────────────────────────────────────────────

export interface UomTypePayload {
  _id?: string;
  name: string;
  description?: string | null;
  defaultCount: number;
  baselinePrice: number;
  currency?: string;
  unit?: string | null;
  isActive?: boolean;
  order?: number;
}

export interface ConfigureBaselinePayload {
  uomTypes: UomTypePayload[];
  billingMonth?: string;
}

export interface UpdateUomPricePayload {
  pricePerUnit: number;
  defaultCount?: number;
  effectiveFrom?: string;
  notes?: string | null;
}

export interface GenerateSnapshotPayload {
  billingMonth?: string;
}

export interface UpdateSnapshotCountsPayload {
  lines: { uomTypeId: string; count: number }[];
  notes?: string | null;
}

export interface AddSnapshotOverridePayload {
  uomTypeId: string;
  newCount: number;
  newPricePerUnit?: number;
  reason: string;
  approvedBy?: string;
}

export interface PricingHistoryResponse {
  uomType: UomType;
  pricingVersions: PricingVersion[];
}
