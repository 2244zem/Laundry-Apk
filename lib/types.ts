// ============================================
// Laundry Management Suite - Type Definitions
// ============================================

export type UserRole = "admin" | "user";

export interface AppUser {
  username: string;
  role: UserRole;
  displayName: string;
}

export const USERS: Record<
  string,
  { password: string; role: UserRole; displayName: string }
> = {
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

export const DEFAULT_PRICES: Record<ServiceType, { label: string; pricePerKg: number }> = {
  cuci_kering:  { label: "Cuci Kering",       pricePerKg: 6000  },
  cuci_setrika: { label: "Cuci + Setrika",     pricePerKg: 8000  },
  setrika_saja: { label: "Setrika Saja",       pricePerKg: 5000  },
  express:      { label: "Express (6 Jam)",    pricePerKg: 15000 },
  premium:      { label: "Premium (Parfum+)",  pricePerKg: 12000 },
};

// SERVICE_OPTIONS resolves from localStorage at runtime; use DEFAULT_PRICES as fallback
export let SERVICE_OPTIONS = { ...DEFAULT_PRICES };

export interface InventoryItem {
  id: string;
  name: string;
  stock: number;
  unit: string;
  minStock: number;
  updatedAt: string;
}

export type OrderStatus =
  | "pending"
  | "washing"
  | "drying"
  | "ironing"
  | "done"
  | "delivered";

export type PaymentStatus = "unpaid" | "paid";

export const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string }> = {
  pending:   { label: "Menunggu",    color: "bg-yellow-500" },
  washing:   { label: "Dicuci",      color: "bg-blue-500"   },
  drying:    { label: "Dikeringkan", color: "bg-orange-500" },
  ironing:   { label: "Disetrika",   color: "bg-purple-500" },
  done:      { label: "Selesai",     color: "bg-green-500"  },
  delivered: { label: "Diantar",     color: "bg-emerald-600"},
};

export interface Order {
  id: string;
  receiptNumber: string;
  customer: Customer;
  items: LaundryItem[];
  totalWeight: number;
  totalPrice: number;
  finalPrice: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  loyaltyPointsEarned: number;
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

export interface ChatMessage {
  id: string;
  fromUsername: string;
  fromRole: UserRole;
  message: string;
  imageUrl?: string;
  timestamp: string;
  read: boolean;
}

export interface StoreProfile {
  name: string;
  address: string;
  phone: string;
  description: string;
}

export type AchievementLevel = "none" | "bronze" | "silver" | "gold";

export interface Achievement {
  level: AchievementLevel;
  totalOrders: number;
  nextLevel: AchievementLevel | null;
  ordersToNext: number | null;
}

export const ACHIEVEMENT_THRESHOLDS = {
  bronze: 1,
  silver: 5,
  gold: 15,
};

export type TabType = "receipt" | "orders" | "todo" | "delivery" | "payment" | "chat" | "pricelist" | "store" | "profile";
