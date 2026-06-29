import { CheckResult } from '@prisma/client';
import { StatusService } from './status.service';

describe('StatusService', () => {
  let prisma: {
    monitor: { findMany: jest.Mock };
    check: { findMany: jest.Mock };
  };
  let service: StatusService;

  beforeEach(() => {
    prisma = {
      monitor: { findMany: jest.fn() },
      check: { findMany: jest.fn() },
    };
    service = new StatusService(prisma as never);
  });

  it('summarizes status and computes 24h uptime', async () => {
    prisma.monitor.findMany.mockResolvedValue([
      { id: 'm1', name: 'A', url: 'https://a.com', createdAt: new Date() },
    ]);
    // first call = recent history (no select); second = day window (has select)
    prisma.check.findMany.mockImplementation((args: { select?: unknown }) => {
      if (args.select) {
        // 3 UP / 1 DOWN over the last 24h => 75%
        return Promise.resolve([
          { result: CheckResult.UP },
          { result: CheckResult.UP },
          { result: CheckResult.UP },
          { result: CheckResult.DOWN },
        ]);
      }
      return Promise.resolve([
        {
          result: CheckResult.UP,
          statusCode: 200,
          responseTimeMs: 100,
          checkedAt: new Date(),
        },
      ]);
    });

    const res = await service.getStatus();

    expect(res.summary).toMatchObject({
      total: 1,
      up: 1,
      down: 0,
      allOperational: true,
    });
    expect(res.monitors[0].status).toBe(CheckResult.UP);
    expect(res.monitors[0].uptime24h).toBe(75);
    expect(res.monitors[0].lastLatencyMs).toBe(100);
  });

  it('reports UNKNOWN and null uptime when a monitor has no checks', async () => {
    prisma.monitor.findMany.mockResolvedValue([
      { id: 'm1', name: 'A', url: 'https://a.com', createdAt: new Date() },
    ]);
    prisma.check.findMany.mockResolvedValue([]);

    const res = await service.getStatus();

    expect(res.monitors[0].status).toBe('UNKNOWN');
    expect(res.monitors[0].uptime24h).toBeNull();
    expect(res.summary.allOperational).toBe(false);
  });
});
