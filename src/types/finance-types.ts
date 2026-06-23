import type { GlobalRecords } from "@/types/global-types";
import type { Project } from "@/api/services/project-management/project-service";

export type PaymentType = "Advance" | "Project Fixed Price" | "CR Based" | "UOM Based" | "Other";
export type PaymentStatus = "Pending" | "Paid" | "Partially Paid" | "Overdue" | "Cancelled";
export type PaymentMethod = "Bank Transfer" | "Cash" | "Online Payment";

export interface Payment extends GlobalRecords {
  project: string | Project;
  paymentId: string;
  paymentType: PaymentType;
  uom: string | null;
  month: string | null;
  quantity: number | null;
  pricePerUnit: number;
  totalAmount: number;
  paymentDate: string | null;
  dueDate: string | null;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  referenceNumber: string | null;
  notes: string | null;
  partiallyPaidAmount: number | null;
  attachment: string | null;
  transactions?: PaymentTransaction[];
  // UOM auto-payment fields
  uomSnapshot: string | null;
  isSystemGenerated: boolean;
}

export interface CreatePaymentPayload {
  paymentType: PaymentType;
  uom?: string | null;
  month?: string | null;
  quantity?: number | null;
  pricePerUnit: number;
  paymentDate?: string | null;
  dueDate?: string | null;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod | null;
  referenceNumber?: string | null;
  notes?: string | null;
  partiallyPaidAmount?: number | null;
  attachment?: File | null;
}

export interface AllocatePaymentPayload {
  amount: number;
  paymentMethod?: PaymentMethod | null;
  paymentDate?: string | null;
  referenceNumber?: string | null;
  notes?: string | null;
}

export interface PaymentTransaction {
  _id: string;
  amount: number;
  paymentDate: string | null;
  paymentMethod: PaymentMethod | null;
  referenceNumber: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentTransactionHistory {
  paymentId: string;
  totalAmount: number;
  partiallyPaidAmount: number;
  paymentStatus: PaymentStatus;
  outstanding: number;
  transactions: PaymentTransaction[];
}

export interface ProjectFinanceSummary {
  totalBilled: number;
  totalReceived: number;
  outstanding: number;
  count: number;
}

export interface FinanceKPIs {
  totalProjects: number;
  totalRevenue: number;
  paid: number;
  pending: number;
  overdue: number;
  monthlyRevenue: number;
}

export interface ProjectWithFinance extends Project {
  finance: ProjectFinanceSummary;
}
