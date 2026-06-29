export type CheckResult = 'UP' | 'DOWN' | 'UNKNOWN';
export interface HistoryPoint {
    result: CheckResult;
    responseTimeMs: number | null;
    checkedAt: string;
}
export interface MonitorStatus {
    id: string;
    name: string;
    url: string;
    status: CheckResult;
    lastStatusCode: number | null;
    lastLatencyMs: number | null;
    lastCheckedAt: string | null;
    uptime24h: number | null;
    history: HistoryPoint[];
}
export interface StatusResponse {
    summary: {
        total: number;
        up: number;
        down: number;
        allOperational: boolean;
        generatedAt: string;
    };
    monitors: MonitorStatus[];
}
