import type { StatusResponse } from './types';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export async function fetchStatus(): Promise<StatusResponse> {
  const res = await fetch(`${BASE}/status`);
  if (!res.ok) {
    throw new Error(`API responded ${res.status}`);
  }
  return res.json() as Promise<StatusResponse>;
}
