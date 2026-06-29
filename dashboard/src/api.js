const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
export async function fetchStatus() {
    const res = await fetch(`${BASE}/status`);
    if (!res.ok) {
        throw new Error(`API responded ${res.status}`);
    }
    return res.json();
}
//# sourceMappingURL=api.js.map