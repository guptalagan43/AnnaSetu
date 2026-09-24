/**
 * Redis Cache for ERS Scores
 * SRS §8.5 & Phase 08 Task: Cache ERS per listing in Redis (15-min TTL)
 */

import { Redis } from "@upstash/redis";

// In-memory fallback cache if Upstash Redis credentials are not configured
const memoryCache = new Map<string, { score: number; expiresAt: number }>();

function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token && url.startsWith("http")) {
    try {
      return new Redis({ url, token });
    } catch (e) {
      console.warn("[ERS Cache] Failed to initialize Upstash Redis:", e);
    }
  }
  return null;
}

const redis = getRedisClient();

/**
 * Cache ERS score for a listing with 15-minute TTL (900s)
 */
export async function cacheListingERS(
  listingId: string,
  score: number,
  ttlSeconds: number = 900
): Promise<void> {
  const key = `ers:${listingId}`;

  if (redis) {
    try {
      await redis.set(key, score, { ex: ttlSeconds });
      return;
    } catch (err) {
      console.warn("[ERS Cache] Redis set failed, falling back to memory:", err);
    }
  }

  // Fallback to in-memory cache
  memoryCache.set(key, {
    score,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

/**
 * Retrieve cached ERS score for a listing
 */
export async function getCachedListingERS(
  listingId: string
): Promise<number | null> {
  const key = `ers:${listingId}`;

  if (redis) {
    try {
      const val = await redis.get<number>(key);
      if (typeof val === "number") {
        return val;
      }
    } catch (err) {
      console.warn("[ERS Cache] Redis get failed, checking memory fallback:", err);
    }
  }

  const cached = memoryCache.get(key);
  if (cached) {
    if (Date.now() < cached.expiresAt) {
      return cached.score;
    }
    memoryCache.delete(key);
  }

  return null;
}

/**
 * Batch cache multiple listing ERS scores
 */
export async function batchCacheListingERS(
  items: { id: string; score: number }[],
  ttlSeconds: number = 900
): Promise<void> {
  await Promise.all(
    items.map((item) => cacheListingERS(item.id, item.score, ttlSeconds))
  );
}
