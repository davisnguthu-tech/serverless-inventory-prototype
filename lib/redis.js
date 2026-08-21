/**
 * Reusable Upstash Redis Client & Local Fallback Utility
 * 
 * Provides a unified interface for serverless functions to interact with Redis.
 * If UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables
 * are set, it connects to Upstash Redis using @upstash/redis.
 * 
 * If running locally without Upstash environment variables configured, it falls back
 * to a thread-safe in-memory cache store so offline testing works seamlessly.
 */

const { Redis } = require('@upstash/redis');

class InMemoryRedisStore {
  constructor() {
    this.store = new Map();
  }

  async get(key) {
    if (!this.store.has(key)) return null;
    const value = this.store.get(key);
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  async set(key, value) {
    const serialized = typeof value === 'object' ? JSON.stringify(value) : String(value);
    this.store.set(key, serialized);
    return "OK";
  }

  async mset(kvPairs) {
    if (Array.isArray(kvPairs)) {
      for (let i = 0; i < kvPairs.length; i += 2) {
        await this.set(kvPairs[i], kvPairs[i + 1]);
      }
    } else if (typeof kvPairs === 'object' && kvPairs !== null) {
      for (const [key, val] of Object.entries(kvPairs)) {
        await this.set(key, val);
      }
    }
    return "OK";
  }

  async keys(pattern = '*') {
    const allKeys = Array.from(this.store.keys());
    if (pattern === '*') return allKeys;
    const regexPattern = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return allKeys.filter(k => regexPattern.test(k));
  }

  async del(key) {
    const existed = this.store.delete(key);
    return existed ? 1 : 0;
  }

  async ping() {
    return "PONG";
  }
}

let redisClient;

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (url && token) {
  redisClient = Redis.fromEnv();
  console.log('✅ Connected to Upstash Redis instance');
} else {
  // Use in-memory fallback for local development without credentials
  if (!global.__inMemoryRedisInstance) {
    global.__inMemoryRedisInstance = new InMemoryRedisStore();
  }
  redisClient = global.__inMemoryRedisInstance;
  console.log('ℹ️ Upstash credentials missing in environment. Using in-memory Redis fallback.');
}

module.exports = redisClient;
