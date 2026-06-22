import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import type { Check } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CheckerService } from './checker.service';

@Injectable()
export class ChecksService {
  private readonly logger = new Logger(ChecksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly checker: CheckerService,
  ) {}

  /** Every minute, probe enabled monitors whose interval has elapsed. */
  @Cron(CronExpression.EVERY_MINUTE)
  async runDueChecks(): Promise<void> {
    const monitors = await this.prisma.monitor.findMany({
      where: { enabled: true },
    });

    const due = await Promise.all(
      monitors.map(async (m) => {
        const last = await this.prisma.check.findFirst({
          where: { monitorId: m.id },
          orderBy: { checkedAt: 'desc' },
        });
        const elapsedSec = last
          ? (Date.now() - last.checkedAt.getTime()) / 1000
          : Number.POSITIVE_INFINITY;
        return elapsedSec >= m.intervalSeconds ? m : null;
      }),
    );

    const toRun = due.filter((m) => m !== null);
    if (toRun.length === 0) return;

    this.logger.log(`Running ${toRun.length} due check(s)`);
    await Promise.all(
      toRun.map((m) =>
        this.checker
          .runCheck(m)
          .catch((e: unknown) =>
            this.logger.error(
              `Check failed for "${m.name}": ${e instanceof Error ? e.message : e}`,
            ),
          ),
      ),
    );
  }

  /** Probe one monitor right now (ignores its interval). */
  async checkNow(monitorId: string): Promise<Check> {
    const monitor = await this.prisma.monitor.findUniqueOrThrow({
      where: { id: monitorId },
    });
    return this.checker.runCheck(monitor);
  }

  /** Probe all enabled monitors right now. */
  checkAllNow(): Promise<Check[]> {
    return this.prisma.monitor
      .findMany({ where: { enabled: true } })
      .then((monitors) =>
        Promise.all(monitors.map((m) => this.checker.runCheck(m))),
      );
  }

  /** Recent check history for a monitor. */
  recentChecks(monitorId: string, take = 20): Promise<Check[]> {
    return this.prisma.check.findMany({
      where: { monitorId },
      orderBy: { checkedAt: 'desc' },
      take,
    });
  }
}
