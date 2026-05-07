// ============================================
// Laundry Management Suite - Type Definitions
// ============================================

export type UserRole = "admin" | "user";

export interface AppUser {
  username: string;
  role: UserRole;
  displayName: string;
}

export const USERS: Record<string, { password: string; role: UserRole; displayName: string }> = {
  admin: { password: "admin123", role: "admin", displayName: "Administrator" },
  kasir: { password: "kasir123", role: "user", displayName: "Kasir" },
};

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  loyaltyPoints: number;
  totalKgWashed: number;
  createdAt: string;
}

export interface LaundryItem {
  id: string;
  service: ServiceType;
  weight: number;
  pricePerKg: number;
  subtotal: number;
  notes: string;
}

export type ServiceType =
  | "cuci_kering"
  | "cuci_setrika"
  | "setrika_saja"
  | "express"
  | "premium";

export const SERVICE_OPTIONS: Record<
  ServiceType,
  { label: string; pricePerKg: number }
> = {
  cuci_kering: { label: "Cuci Kering", pricePerKg: 5000 },
  cuci_setrika: { label: "Cuci + Setrika", pricePerKg: 7000 },
  setrika_saja: { label: "Setrika Saja", pricePerKg: 4000 },
  express: { label: "Express (6 Jam)", pricePerKg: 12000 },
  premium: { label: "Premium (Parfum+)", pricePerKg: 10000 },
};

export type OrderStatus =
  | "pending"
  | "washing"
  | "drying"
  | "ironing"
  | "done"
  | "delivered";

export type PaymentStatus = "unpaid" | "paid";

export const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string }
> = {
  pending: { label: "Menunggu", color: "bg-yellow-500" },
  washing: { label: "Dicuci", color: "bg-blue-500" },
  drying: { label: "Dikeringkan", color: "bg-orange-500" },
  ironing: { label: "Disetrika", color: "bg-purple-500" },
  done: { label: "Selesai", color: "bg-green-500" },
  delivered: { label: "Diantar", color: "bg-emerald-600" },
};

export interface Order {
  id: string;
  receiptNumber: string;
  customer: Customer;
  items: LaundryItem[];
  totalWeight: number;
  totalPrice: number;
  discount: number;
  finalPrice: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  loyaltyPointsEarned: number;
  loyaltyDiscountApplied: boolean;
  createdAt: string;
  estimatedDone: string;
  notes: string;
  createdBy: string;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  createdAt: string;
  completedAt?: string;
}

export interface DeliveryItem {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  address: string;
  status: "pending" | "picked_up" | "on_the_way" | "delivered";
  type: "pickup" | "delivery";
  scheduledAt: string;
  completedAt?: string;
  notes: string;
  createdBy: string;
}

export type TabType = "receipt" | "orders" | "todo" | "delivery" | "payment";
