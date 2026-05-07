// ============================================
// localStorage Persistence Layer
// ============================================

import { Order, TodoItem, DeliveryItem, Customer, AppUser, USERS } from "./types";

const KEYS = {
  ORDERS: "laundry_orders",
  TODOS: "laundry_todos",
  DELIVERIES: "laundry_deliveries",
  CUSTOMERS: "laundry_customers",
  COUNTER: "laundry_receipt_counter",
  AUTH: "laundry_auth",
};

// ---------- Generic Helpers ----------

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Storage write error:", e);
  }
}

// ---------- Auth ----------

export function login(username: string, password: string): AppUser | null {
  const entry = USERS[username];
  if (!entry || entry.password !== password) return null;
  const user: AppUser = { username, role: entry.role, displayName: entry.displayName };
  setItem(KEYS.AUTH, user);
  return user;
}

export function logout(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEYS.AUTH);
}

export function getLoggedInUser(): AppUser | null {
  return getItem<AppUser | null>(KEYS.AUTH, null);
}

// ---------- Orders ----------

export function getOrders(): Order[] {
  return getItem<Order[]>(KEYS.ORDERS, []);
}

export function saveOrders(orders: Order[]): void {
  setItem(KEYS.ORDERS, orders);
}

export function addOrder(order: Order): void {
  const orders = getOrders();
  orders.unshift(order);
  saveOrders(orders);
}

export function updateOrder(id: string, updates: Partial<Order>): void {
  const orders = getOrders().map((o) =>
    o.id === id ? { ...o, ...updates } : o
  );
  saveOrders(orders);
}

export function deleteOrder(id: string): void {
  saveOrders(getOrders().filter((o) => o.id !== id));
}

// ---------- Todos ----------

export function getTodos(): TodoItem[] {
  return getItem<TodoItem[]>(KEYS.TODOS, []);
}

export function saveTodos(todos: TodoItem[]): void {
  setItem(KEYS.TODOS, todos);
}

// ---------- Deliveries ----------

export function getDeliveries(): DeliveryItem[] {
  return getItem<DeliveryItem[]>(KEYS.DELIVERIES, []);
}

export function saveDeliveries(deliveries: DeliveryItem[]): void {
  setItem(KEYS.DELIVERIES, deliveries);
}

// ---------- Customers ----------

export function getCustomers(): Customer[] {
  return getItem<Customer[]>(KEYS.CUSTOMERS, []);
}

export function saveCustomers(customers: Customer[]): void {
  setItem(KEYS.CUSTOMERS, customers);
}

export function findOrCreateCustomer(
  name: string,
  phone: string,
  address: string
): Customer {
  const customers = getCustomers();
  let existing = customers.find(
    (c) => c.phone === phone || c.name.toLowerCase() === name.toLowerCase()
  );

  if (existing) {
    existing.name = name;
    existing.phone = phone;
    existing.address = address;
    saveCustomers(customers);
    return existing;
  }

  const newCustomer: Customer = {
    id: generateId(),
    name,
    phone,
    address,
    loyaltyPoints: 0,
    totalKgWashed: 0,
    createdAt: new Date().toISOString(),
  };

  customers.push(newCustomer);
  saveCustomers(customers);
  return newCustomer;
}

export function updateCustomerLoyalty(
  customerId: string,
  kgAdded: number,
  pointsEarned: number
): Customer | null {
  const customers = getCustomers();
  const idx = customers.findIndex((c) => c.id === customerId);
  if (idx === -1) return null;

  customers[idx].totalKgWashed += kgAdded;
  customers[idx].loyaltyPoints += pointsEarned;
  saveCustomers(customers);
  return customers[idx];
}

export function redeemLoyaltyPoints(customerId: string, pointsToRedeem: number): boolean {
  const customers = getCustomers();
  const idx = customers.findIndex((c) => c.id === customerId);
  if (idx === -1 || customers[idx].loyaltyPoints < pointsToRedeem) return false;

  customers[idx].loyaltyPoints -= pointsToRedeem;
  saveCustomers(customers);
  return true;
}

// ---------- Receipt Counter ----------

export function getNextReceiptNumber(): string {
  const counter = getItem<number>(KEYS.COUNTER, 0) + 1;
  setItem(KEYS.COUNTER, counter);
  const today = new Date();
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
  return `LND-${dateStr}-${String(counter).padStart(4, "0")}`;
}

// ---------- Utilities ----------

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

// ---------- Sync to PHP Backend ----------

export async function syncToBackend(endpoint: string = "/api.php") {
  const payload = {
    orders: getOrders(),
    customers: getCustomers(),
    todos: getTodos(),
    deliveries: getDeliveries(),
    syncedAt: new Date().toISOString(),
  };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sync", data: payload }),
    });
    return await res.json();
  } catch (error) {
    console.error("Sync failed:", error);
    return { success: false, error: "Network error" };
  }
}
