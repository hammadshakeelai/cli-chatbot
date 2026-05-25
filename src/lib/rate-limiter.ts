// In-memory rate limiter (replace with Upstash KV for production)
// Tracks per-IP request counts with sliding window

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 20;   // per window
const MAX_DAILY = 300;

interface Bucket {
  timestamps: number[];
  day: string;
  dailyCount: number;
}

const buckets = new Map<string, Bucket>();

function getDayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const dayKey = getDayKey();

  let bucket = buckets.get(ip);
  if (!bucket) {
    bucket = { timestamps: [], day: dayKey, dailyCount: 0 };
    buckets.set(ip, bucket);
  }

  // Reset daily if new day
  if (bucket.day !== dayKey) {
    bucket.day = dayKey;
    bucket.dailyCount = 0;
  }

  // Prune old entries outside window
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < WINDOW_MS);

  const windowCount = bucket.timestamps.length;
  const dailyCount = bucket.dailyCount;

  if (windowCount >= MAX_REQUESTS || dailyCount >= MAX_DAILY) {
    const oldest = bucket.timestamps[0] ?? now;
    const resetIn = WINDOW_MS - (now - oldest);
    return { allowed: false, remaining: 0, resetIn: Math.max(1, resetIn) };
  }

  bucket.timestamps.push(now);
  bucket.dailyCount++;

  return {
    allowed: true,
    remaining: Math.min(MAX_REQUESTS - windowCount - 1, MAX_DAILY - dailyCount - 1),
    resetIn: WINDOW_MS,
  };
}
