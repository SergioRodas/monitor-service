import { Injectable } from '@nestjs/common';
import { CheckResult } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const DAY_MS = 24 * 60 * 60 * 1000;
const SPARKLINE_POINTS = 30;

@Injectable()
export class StatusService {
  constructor(private readonly prisma: PrismaService) {}

  /** Aggregated current status for every enabled monitor (feeds the dashboard). */
  async getStatus() {
    const monitors = await this.prisma.monitor.findMany({
      where: { enabled: true },
      orderBy: { createdAt: 'asc' },
    });
    const since = new Date(Date.now() - DAY_MS);

    const items = await Promise.all(
      monitors.map(async (m) => {
        const recent = await this.prisma.check.findMany({
          where: { monitorId: m.id },
          orderBy: { checkedAt: 'desc' },
          take: SPARKLINE_POINTS,
        });
        const dayChecks = await this.prisma.check.findMany({
          where: { monitorId: m.id, checkedAt: { gte: since } },
          select: { result: true },
        });

        const last = recent[0];
        const ups = dayChecks.filter((c) => c.result === CheckResult.UP).length;
        const uptime24h =
          dayChecks.length > 0
            ? Math.round((ups / dayChecks.length) * 1000) / 10
            : null;

        return {
          id: m.id,
          name: m.name,
          url: m.url,
          status: last ? last.result : 'UNKNOWN',
          lastStatusCode: last?.statusCode ?? null,
          lastLatencyMs: last?.responseTimeMs ?? null,
          lastCheckedAt: last?.checkedAt ?? null,
          uptime24h,
          // oldest → newest, for a left-to-right sparkline
          history: recent
            .slice()
            .reverse()
            .map((c) => ({
              result: c.result,
              responseTimeMs: c.responseTimeMs,
              checkedAt: c.checkedAt,
            })),
        };
      }),
    );

    const up = items.filter((i) => i.status === CheckResult.UP).length;
    return {
      summary: {
        total: items.length,
        up,
        down: items.length - up,
        allOperational: items.length > 0 && items.every((i) => i.status === CheckResult.UP),
        generatedAt: new Date(),
      },
      monitors: items,
    };
  }
}
