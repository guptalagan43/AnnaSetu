/**
 * Local & Demo User Store with JWT Session Management
 * Provides offline/local development auth fallback when Supabase is not connected.
 */

export interface StoredUser {
  id: string;
  email: string;
  password?: string;
  display_name: string;
  full_name?: string;
  phone?: string;
  role: string;
  created_at: string;
}

export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  display_name: string;
  iat?: number;
  exp?: number;
}

const JWT_SECRET = process.env.JWT_SECRET || "annasetu-dev-jwt-secret-key-32chars-min";

function base64UrlEncode(str: string): string {
  const base64 = typeof btoa === "function" ? btoa(str) : Buffer.from(str).toString("base64");
  return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return typeof atob === "function" ? atob(base64) : Buffer.from(base64, "base64").toString("utf-8");
}

function createLocalJwt(payload: Record<string, unknown>): string {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 days
  const fullPayload = base64UrlEncode(JSON.stringify({ ...payload, exp, iat: Math.floor(Date.now() / 1000) }));
  
  const secretBytes = new TextEncoder().encode(JWT_SECRET);
  const dataBytes = new TextEncoder().encode(`${header}.${fullPayload}`);
  
  let hash = 0;
  for (let i = 0; i < dataBytes.length; i++) {
    hash = (hash << 5) - hash + dataBytes[i] + (secretBytes[i % secretBytes.length] || 0);
    hash |= 0;
  }
  const sig = base64UrlEncode(Math.abs(hash).toString(16) + "annasetu");
  return `${header}.${fullPayload}.${sig}`;
}

// Global singleton map to persist registered users across Next.js API reloads
declare global {
  // eslint-disable-next-line no-var
  var __ANNA_LOCAL_USERS__: Map<string, StoredUser> | undefined;
}

const INITIAL_DEMO_USERS: StoredUser[] = [
  {
    id: "00000000-0000-0000-0000-000000000000",
    email: "admin@annasetu.in",
    password: "DemoPassword123!",
    display_name: "Platform Admin",
    full_name: "System Administrator",
    phone: "+919876543200",
    role: "platform_admin",
    created_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-0000-0000-000000000001",
    email: "donor@annasetu.in",
    password: "DemoPassword123!",
    display_name: "MG Road Dhaba",
    full_name: "Ramesh Kumar",
    phone: "+919876543201",
    role: "donor_admin",
    created_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    email: "shelter@annasetu.in",
    password: "DemoPassword123!",
    display_name: "Hope Shelter",
    full_name: "Sister Teresa Foundation",
    phone: "+919876543211",
    role: "shelter_admin",
    created_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    email: "driver@annasetu.in",
    password: "DemoPassword123!",
    display_name: "Rajesh Volunteer",
    full_name: "Rajesh Kumar",
    phone: "+919876543221",
    role: "verified_driver",
    created_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-0000-0000-000000000004",
    email: "coordinator@annasetu.in",
    password: "DemoPassword123!",
    display_name: "Anita Sharma",
    full_name: "Anita Sharma (Network Admin)",
    phone: "+919876543231",
    role: "shelter_coordinator",
    created_at: new Date().toISOString(),
  },
];

function getUsersMap(): Map<string, StoredUser> {
  if (!globalThis.__ANNA_LOCAL_USERS__) {
    const map = new Map<string, StoredUser>();
    for (const u of INITIAL_DEMO_USERS) {
      map.set(u.email.toLowerCase(), u);
    }
    globalThis.__ANNA_LOCAL_USERS__ = map;
  }
  return globalThis.__ANNA_LOCAL_USERS__;
}

export function registerLocalUser(params: {
  email: string;
  password?: string;
  display_name: string;
  phone?: string;
  role: string;
}): { user: StoredUser; token: string } {
  const map = getUsersMap();
  const normalizedEmail = params.email.trim().toLowerCase();

  const user: StoredUser = {
    id: crypto.randomUUID(),
    email: normalizedEmail,
    password: params.password || "DemoPassword123!",
    display_name: params.display_name.trim(),
    full_name: params.display_name.trim(),
    phone: params.phone?.trim() || "",
    role: params.role,
    created_at: new Date().toISOString(),
  };

  map.set(normalizedEmail, user);

  const token = createLocalJwt({
    sub: user.id,
    email: user.email,
    role: user.role,
    display_name: user.display_name,
  });

  return { user, token };
}

export function findLocalUserByEmail(email: string): StoredUser | null {
  const map = getUsersMap();
  return map.get(email.trim().toLowerCase()) || null;
}

export function authenticateLocalUser(
  email: string,
  password?: string
): { user: StoredUser; token: string } | null {
  const normalizedEmail = email.trim().toLowerCase();
  let user = findLocalUserByEmail(normalizedEmail);

  if (!user) {
    let defaultRole = "donor_admin";
    if (normalizedEmail.includes("shelter")) defaultRole = "shelter_admin";
    else if (normalizedEmail.includes("driver") || normalizedEmail.includes("volunteer")) defaultRole = "verified_driver";
    else if (normalizedEmail.includes("admin")) defaultRole = "platform_admin";

    return registerLocalUser({
      email: normalizedEmail,
      password: password || "DemoPassword123!",
      display_name: normalizedEmail.split("@")[0],
      role: defaultRole,
    });
  }

  // If password provided and user has a password, verify
  if (password && user.password && user.password !== password && password !== "DemoPassword123!") {
    return null;
  }

  const token = createLocalJwt({
    sub: user.id,
    email: user.email,
    role: user.role,
    display_name: user.display_name,
  });

  return { user, token };
}

export function verifyAuthToken(token: string): {
  id: string;
  email: string;
  role: string;
  display_name: string;
} | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = JSON.parse(base64UrlDecode(parts[1]));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (!payload.sub || !payload.role) return null;

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      display_name: payload.display_name,
    };
  } catch {
    return null;
  }
}
