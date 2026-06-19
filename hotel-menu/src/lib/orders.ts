// Order status is stored as a plain string in SQLite (no native enums).
// These constants are the single source of truth for valid values.

export const ORDER_STATUSES = [
  "PENDING",
  "PREPARING",
  "READY",
  "DELIVERED",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

// Statuses that still need kitchen attention (shown as "active" on the POS).
export const ACTIVE_STATUSES: OrderStatus[] = ["PENDING", "PREPARING", "READY"];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "New",
  PREPARING: "Preparing",
  READY: "Ready",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

// Tailwind class hints per status (used in badges).
export const STATUS_STYLE: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  PREPARING: "bg-blue-100 text-blue-800 border-blue-200",
  READY: "bg-emerald-100 text-emerald-800 border-emerald-200",
  DELIVERED: "bg-slate-100 text-slate-600 border-slate-200",
  CANCELLED: "bg-rose-100 text-rose-700 border-rose-200",
};

// Allowed forward transitions for the POS workflow.
export const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: "PREPARING",
  PREPARING: "READY",
  READY: "DELIVERED",
};
