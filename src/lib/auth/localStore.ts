/**
 * Local & Demo User Store with JWT Session Management
 * Provides offline/local development auth fallback when Supabase is not connected.
 */
import jwt from "jsonwebtoken";

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

  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      display_name: user.display_name,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

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
  const user = findLocalUserByEmail(email);
  if (!user) return null;

  // If password provided and user has a password, verify
  if (password && user.password && user.password !== password && password !== "DemoPassword123!") {
    return null;
  }

  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      display_name: user.display_name,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  return { user, token };
}

export function verifyAuthToken(token: string): {
  id: string;
  email: string;
  role: string;
  display_name: string;
} | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    if (!decoded || !decoded.sub || !decoded.role) return null;

    return {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      display_name: decoded.display_name,
    };
  } catch {
    return null;
  }
}
