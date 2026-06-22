import { Injectable, Logger } from '@nestjs/common';
import { CheckResult, type Check, type Monitor } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_TIMEOUT_MS = 10_000;

interface ProbeOutcome {
  result: CheckResult;
  statusCode: number | null;
  responseTimeMs: number;
  error: string | null;
}

@Injectable()
export class CheckerService {
  private readonly logger = new Logger(CheckerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Probe a single monitor, persist the result, and reconcile its incident. */
  async runCheck(monitor: Monitor): Promise<Check> {
    const outcome = await this.probe(monitor);

    const check = await this.prisma.check.create({
      data: {
        monitorId: monitor.id,
        result: outcome.result,
        statusCode: outcome.statusCode,
        responseTimeMs: outcome.responseTimeMs,
        error: outcome.error,
      },
    });

    await this.reconcileIncident(monitor, outcome);
    return check;
  }

  private async probe(monitor: Monitor): Promise<ProbeOutcome> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
    const startedAt = performance.now();

    try {
      const res = await fetch(monitor.url, {
        method: monitor.method,
        signal: controller.signal,
        redirect: 'follow',
      });
      const responseTimeMs = Math.round(performance.now() - startedAt);
      const healthy = res.status === monitor.expectedStatus;
      return {
        result: healthy ? CheckResult.UP : CheckResult.DOWN,
        statusCode: res.status,
        responseTimeMs,
        error: healthy
          ? null
          : `Expected ${monitor.expectedStatus}, got ${res.status}`,
      };
    } catch (err) {
      const responseTimeMs = Math.round(performance.now() - startedAt);
      const error = controller.signal.aborted
        ? `Timeout after ${DEFAULT_TIMEOUT_MS}ms`
        : err instanceof Error
          ? err.message
          : 'Unknown error';
      return { result: CheckResult.DOWN, statusCode: null, responseTimeMs, error };
    } finally {
      clearTimeout(timer);
    }
  }

  /** Open an incident on the first failure, keep it updated, close it on recovery. */
  private async reconcileIncident(
    monitor: Monitor,
    outcome: ProbeOutcome,
  ): Promise<void> {
    const openIncident = await this.prisma.incident.findFirst({
      where: { monitorId: monitor.id, resolvedAt: null },
      orderBy: { startedAt: 'desc' },
    });

    if (outcome.result === CheckResult.DOWN) {
      if (openIncident) {
        await this.prisma.incident.update({
          where: { id: openIncident.id },
          data: { lastError: outcome.error },
        });
      } else {
        await this.prisma.incident.create({
          data: { monitorId: monitor.id, lastError: outcome.error },
        });
        this.logger.warn(`Incident OPENED for "${monitor.name}": ${outcome.error}`);
      }
    } else if (openIncident) {
      await this.prisma.incident.update({
        where: { id: openIncident.id },
        data: { resolvedAt: new Date() },
      });
      this.logger.log(`Incident RESOLVED for "${monitor.name}"`);
    }
  }
}
