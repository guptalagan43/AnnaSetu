import type { ConnectionOptions } from "bullmq";

function getRedisConnection(): ConnectionOptions {
  if (process.env.REDIS_URL) {
    try {
      const parsed = new URL(process.env.REDIS_URL);
      return {
        host: parsed.hostname,
        port: parseInt(parsed.port || "6379", 10),
        username: parsed.username || undefined,
        password: parsed.password || undefined,
        tls: parsed.protocol === "rediss:" ? {} : undefined,
        maxRetriesPerRequest: null,
      };
    } catch {
      // fallback
    }
  }

  const urlStr = process.env.UPSTASH_REDIS_REST_URL || "";
  let host = "localhost";
  try {
    if (urlStr.startsWith("http")) {
      host = new URL(urlStr).hostname;
    } else if (urlStr) {
      host = urlStr;
    }
  } catch {
    // fallback
  }

  const isLocal = host === "localhost" || host === "127.0.0.1";

  return {
    host,
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
    password: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_PASSWORD || undefined,
    tls: isLocal ? undefined : {},
    maxRetriesPerRequest: null,
  };
}

export const redisConnection: ConnectionOptions = getRedisConnection();
export const redis = redisConnection;