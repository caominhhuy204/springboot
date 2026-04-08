import axios from "axios";
import { apiBaseUrl } from "@/config/runtime";

const HEALTH_PATH = "/api/health";
const RETRY_DELAY_MS = 3000;
const DEFAULT_TIMEOUT_MS = 70000;
const REQUEST_TIMEOUT_MS = 10000;
const WARM_CACHE_MS = 120000;

let pendingWakePromise: Promise<boolean> | null = null;
let lastWakeAt = 0;

const sleep = (delayMs: number) => new Promise((resolve) => window.setTimeout(resolve, delayMs));

export const pingBackendHealth = () =>
  axios.get(`${apiBaseUrl}${HEALTH_PATH}`, {
    timeout: REQUEST_TIMEOUT_MS,
    withCredentials: false,
  });

const probeBackend = async (timeoutMs: number) => {
  const startedAt = Date.now();
  let lastError: unknown;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      await pingBackendHealth();
      return true;
    } catch (error) {
      lastError = error;
      await sleep(RETRY_DELAY_MS);
    }
  }

  throw lastError ?? new Error("Backend wake-up timed out");
};

export const wakeBackend = (timeoutMs = DEFAULT_TIMEOUT_MS) => {
  if (Date.now() - lastWakeAt < WARM_CACHE_MS) {
    return Promise.resolve(true);
  }

  if (pendingWakePromise) {
    return pendingWakePromise;
  }

  pendingWakePromise = probeBackend(timeoutMs)
    .then(() => {
      lastWakeAt = Date.now();
      return true;
    })
    .finally(() => {
      pendingWakePromise = null;
    });

  return pendingWakePromise;
};
