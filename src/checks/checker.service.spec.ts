import { CheckResult, type Monitor } from '@prisma/client';
import { CheckerService } from './checker.service';

function makeMonitor(overrides: Partial<Monitor> = {}): Monitor {
  return {
    id: 'm1',
    name: 'Test',
    url: 'https://example.com',
    method: 'GET',
    expectedStatus: 200,
    intervalSeconds: 300,
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('CheckerService', () => {
  let prisma: {
    check: { create: jest.Mock };
    incident: { findFirst: jest.Mock; create: jest.Mock; update: jest.Mock };
  };
  let service: CheckerService;

  beforeEach(() => {
    prisma = {
      check: { create: jest.fn().mockResolvedValue({ id: 'c1' }) },
      incident: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'inc1' }),
        update: jest.fn().mockResolvedValue({ id: 'inc1' }),
      },
    };
    service = new CheckerService(prisma as never);
  });

  afterEach(() => jest.restoreAllMocks());

  it('records UP when the status matches expectedStatus', async () => {
    global.fetch = jest.fn().mockResolvedValue({ status: 200 }) as never;

    await service.runCheck(makeMonitor());

    expect(prisma.check.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          result: CheckResult.UP,
          statusCode: 200,
          error: null,
        }),
      }),
    );
    expect(prisma.incident.create).not.toHaveBeenCalled();
  });

  it('records DOWN and opens an incident on a wrong status code', async () => {
    global.fetch = jest.fn().mockResolvedValue({ status: 500 }) as never;

    await service.runCheck(makeMonitor());

    expect(prisma.check.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          result: CheckResult.DOWN,
          statusCode: 500,
        }),
      }),
    );
    expect(prisma.incident.create).toHaveBeenCalledTimes(1);
  });

  it('records DOWN on a network error (no status code)', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED')) as never;

    await service.runCheck(makeMonitor());

    expect(prisma.check.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          result: CheckResult.DOWN,
          statusCode: null,
          error: 'ECONNREFUSED',
        }),
      }),
    );
  });

  it('resolves an open incident when the monitor recovers', async () => {
    prisma.incident.findFirst.mockResolvedValue({ id: 'inc1' });
    global.fetch = jest.fn().mockResolvedValue({ status: 200 }) as never;

    await service.runCheck(makeMonitor());

    expect(prisma.incident.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'inc1' },
        data: expect.objectContaining({ resolvedAt: expect.any(Date) }),
      }),
    );
    expect(prisma.incident.create).not.toHaveBeenCalled();
  });

  it('updates (not re-creates) the open incident while still down', async () => {
    prisma.incident.findFirst.mockResolvedValue({ id: 'inc1' });
    global.fetch = jest.fn().mockResolvedValue({ status: 503 }) as never;

    await service.runCheck(makeMonitor());

    expect(prisma.incident.create).not.toHaveBeenCalled();
    expect(prisma.incident.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'inc1' },
        data: { lastError: expect.any(String) },
      }),
    );
  });
});
