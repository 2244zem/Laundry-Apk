// ============================================
// localStorage + Cookie Persistence Layer
// ============================================

import {
  Order, TodoItem, DeliveryItem, Customer, AppUser, USERS,
  DEFAULT_PRICES, SERVICE_OPTIONS, StoreProfile, ChatMessage,
  Achievement, AchievementLevel, ACHIEVEMENT_THRESHOLDS,
} from "./types";

const KEYS = {
  ORDERS:       "laundry_orders",
  TODOS:        "laundry_todos",
  DELIVERIES:   "laundry_deliveries",
  CUSTOMERS:    "laundry_customers",
  COUNTER:      "laundry_receipt_counter",
  AUTH:         "laundry_auth",
  PRICELIST:    "laundry_pricelist",
  STORE:        "laundry_store",
  CHAT:         "laundry_chat",
  USERS_DB:     "laundry_users_list", // Local persistent user DB
  INVENTORY:    "laundry_inventory",
};

export function getInventory(): any[] {
  const data = getItem(KEYS.INVENTORY, []);
  if (data && data.length > 0) return data;
  
  const defaults = [
    { id: "1", name: "Detergen", stock: 10, unit: "liter", minStock: 2, updatedAt: new Date().toISOString() },
    { id: "2", name: "Pewangi Sakura", stock: 5, unit: "liter", minStock: 1, updatedAt: new Date().toISOString() },
    { id: "3", name: "Plastik 5kg", stock: 100, unit: "pcs", minStock: 20, updatedAt: new Date().toISOString() },
  ];
  if (!data || data.length === 0) setItem(KEYS.INVENTORY, defaults);
  return defaults;
}

export function updateInventoryItem(id: string, updates: any) {
  const items = getInventory();
  const idx = items.findIndex((i: any) => i.id === id);
  if (idx !== -1) {
    items[idx] = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
    setItem(KEYS.INVENTORY, items);
  } else if (updates.name) {
    items.push({ id: Math.random().toString(36).substr(2, 9), ...updates, updatedAt: new Date().toISOString() });
    setItem(KEYS.INVENTORY, items);
  }
}

export function deleteInventoryItem(id: string) {
  const items = getInventory().filter((i: any) => i.id !== id);
  setItem(KEYS.INVENTORY, items);
}

// ---------- Generic Helpers ----------

async function fetchWithTimeout(resource: string, options: RequestInit & { timeout?: number } = {}) {
  const { timeout = 2500 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const response = await fetch(resource, {
    ...options,
    signal: controller.signal
  });
  clearTimeout(id);
  return response;
}


function getItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
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

// ---------- Auth (Cookie + localStorage) ----------

// ---------- Auth (Cookie + localStorage) ----------

export async function login(username: string, password: string): Promise<AppUser | null> {
  // Local persistence only for stability on Vercel/Static hosting
  const entry = USERS[username];
  const dynamicUsers = getItem<Record<string, any>>(KEYS.USERS_DB, {});
  const userEntry = entry || dynamicUsers[username];

  if (!userEntry || userEntry.password !== password) return null;
  
  const user: AppUser = { username, role: userEntry.role, displayName: userEntry.displayName };
  setItem(KEYS.AUTH, user);
  
  // Safe Base64 encoding for cookie
  try {
    const payload = btoa(encodeURIComponent(JSON.stringify({ username, role: userEntry.role })));
    document.cookie = `laundry_session=${payload}; path=/; max-age=86400; SameSite=Strict`;
  } catch (e) {
    console.error("Cookie setting error:", e);
  }
  
  return user;
}

export async function register(username: string, email: string, password: string, displayName: string): Promise<{ success: boolean; error?: string }> {
  try {
    const dynamicUsers = getItem<Record<string, any>>(KEYS.USERS_DB, {});
    
    // Check if user already exists
    if (USERS[username] || dynamicUsers[username]) {
      return { success: false, error: "Username sudah digunakan." };
    }
    
    const emailExists = Object.values(dynamicUsers).some((u: any) => u.email === email);
    if (emailExists) {
      return { success: false, error: "Email sudah terdaftar." };
    }

    // Save new user
    dynamicUsers[username] = { 
      password, 
      role: "user", 
      displayName, 
      email, 
      createdAt: new Date().toISOString() 
    };
    
    setItem(KEYS.USERS_DB, dynamicUsers);
    return { success: true };
  } catch (e) {
    console.error("Register error:", e);
    return { success: false, error: "Terjadi kesalahan saat menyimpan data." };
  }
}


export function logout(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEYS.AUTH);
  document.cookie = "laundry_session=; path=/; max-age=0";
}

export function getLoggedInUser(): AppUser | null {
  return getItem<AppUser | null>(KEYS.AUTH, null);
}

// ---------- Pricelist (Dynamic) ----------

export function getPricelist() {
  const stored = getItem<typeof DEFAULT_PRICES | null>(KEYS.PRICELIST, null);
  return stored ?? DEFAULT_PRICES;
}

export function savePricelist(pricelist: typeof DEFAULT_PRICES): void {
  setItem(KEYS.PRICELIST, pricelist);
  // Update in-memory SERVICE_OPTIONS
  Object.assign(SERVICE_OPTIONS, pricelist);
}

export function getServiceOptions() {
  return getPricelist();
}

// ---------- Store Profile ----------

const DEFAULT_STORE: StoreProfile = {
  name: "Ungu Laundry",
  address: "Jl. Contoh No. 1, Kota Anda",
  phone: "08xxx-xxxx-xxxx",
  description: "Layanan laundry profesional, bersih, dan tepat waktu.",
};

export function getStoreProfile(): StoreProfile {
  return getItem<StoreProfile>(KEYS.STORE, DEFAULT_STORE);
}

export function saveStoreProfile(profile: StoreProfile): void {
  setItem(KEYS.STORE, profile);
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
  saveOrders(getOrders().map((o) => (o.id === id ? { ...o, ...updates } : o)));
}

export function deleteOrder(id: string): void {
  saveOrders(getOrders().filter((o) => o.id !== id));
}

export function getUserOrders(username: string): Order[] {
  return getOrders().filter((o) => o.createdBy === username);
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

export function findOrCreateCustomer(name: string, phone: string, address: string): Customer {
  const customers = getCustomers();
  let existing = customers.find(
    (c) => c.phone === phone || c.name.toLowerCase() === name.toLowerCase()
  );
  if (existing) {
    existing.name = name; existing.phone = phone; existing.address = address;
    saveCustomers(customers);
    return existing;
  }
  const newCust: Customer = {
    id: generateId(), name, phone, address,
    loyaltyPoints: 0, totalKgWashed: 0, createdAt: new Date().toISOString(),
  };
  customers.push(newCust);
  saveCustomers(customers);
  return newCust;
}

export function updateCustomerLoyalty(customerId: string, weight: number, points: number): Customer | null {
  const customers = getCustomers();
  const idx = customers.findIndex((c) => c.id === customerId);
  if (idx === -1) return null;
  customers[idx].totalKgWashed += weight;
  customers[idx].loyaltyPoints += points;
  saveCustomers(customers);
  return customers[idx];
}

export function redeemLoyaltyPoints(customerId: string, points: number): boolean {
  const customers = getCustomers();
  const idx = customers.findIndex((c) => c.id === customerId);
  if (idx === -1 || customers[idx].loyaltyPoints < points) return false;
  customers[idx].loyaltyPoints -= points;
  saveCustomers(customers);
  return true;
}

// ---------- Achievement ----------

export function getAchievement(username: string): Achievement {
  const orders = getUserOrders(username);
  const total = orders.length;

  let level: AchievementLevel = "none";
  if (total >= ACHIEVEMENT_THRESHOLDS.gold)   level = "gold";
  else if (total >= ACHIEVEMENT_THRESHOLDS.silver) level = "silver";
  else if (total >= ACHIEVEMENT_THRESHOLDS.bronze) level = "bronze";

  const nextMap: Record<AchievementLevel, AchievementLevel | null> = {
    none: "bronze", bronze: "silver", silver: "gold", gold: null,
  };
  const thresholds: Record<string, number> = {
    bronze: ACHIEVEMENT_THRESHOLDS.bronze,
    silver: ACHIEVEMENT_THRESHOLDS.silver,
    gold:   ACHIEVEMENT_THRESHOLDS.gold,
  };
  const nextLevel = nextMap[level];
  const ordersToNext = nextLevel ? Math.max(0, thresholds[nextLevel] - total) : null;

  return { level, totalOrders: total, nextLevel, ordersToNext };
}

// ---------- Chat ----------

type ChatStore = Record<string, ChatMessage[]>;

export function getChatStore(): ChatStore {
  return getItem<ChatStore>(KEYS.CHAT, {});
}

export function getConversation(username: string): ChatMessage[] {
  return getChatStore()[username] ?? [];
}

export function getAllConversations(): { username: string; messages: ChatMessage[]; unread: number }[] {
  const store = getChatStore();
  return Object.entries(store).map(([username, messages]) => ({
    username,
    messages,
    unread: messages.filter((m) => m.fromRole === "user" && !m.read).length,
  })).sort((a, b) => {
    const aLast = a.messages[a.messages.length - 1]?.timestamp ?? "";
    const bLast = b.messages[b.messages.length - 1]?.timestamp ?? "";
    return bLast.localeCompare(aLast);
  });
}

export function sendMessage(username: string, fromRole: "admin" | "user", message: string, imageUrl?: string): ChatMessage {
  const store = getChatStore();
  if (!store[username]) store[username] = [];
  const msg: ChatMessage = {
    id: generateId(),
    fromUsername: fromRole === "admin" ? "admin" : username,
    fromRole,
    message,
    imageUrl,
    timestamp: new Date().toISOString(),
    read: false,
  };
  store[username].push(msg);
  setItem(KEYS.CHAT, store);
  return msg;
}

export function markConversationRead(username: string, byRole: "admin" | "user"): void {
  const store = getChatStore();
  if (!store[username]) return;
  store[username] = store[username].map((m) =>
    m.fromRole !== byRole ? { ...m, read: true } : m
  );
  setItem(KEYS.CHAT, store);
}

// ---------- Receipt Counter ----------

export function getNextReceiptNumber(): string {
  const counter = getItem<number>(KEYS.COUNTER, 0) + 1;
  setItem(KEYS.COUNTER, counter);
  const d = new Date();
  const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `LND-${dateStr}-${String(counter).padStart(4, "0")}`;
}

// ---------- Utilities ----------

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(dateStr));
}

// ---------- Sync Stub ----------

export async function syncToBackend(endpoint = "/api.php") {
  const payload = {
    orders: getOrders(), customers: getCustomers(),
    todos: getTodos(), deliveries: getDeliveries(),
    syncedAt: new Date().toISOString(),
  };
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sync", data: payload }),
    });
    return await res.json();
  } catch {
    return { success: false, error: "Network error" };
  }
}
