import { NotFoundException } from '@nestjs/common';
import { MonitorsService } from './monitors.service';

describe('MonitorsService', () => {
  let prisma: {
    monitor: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };
  let service: MonitorsService;

  beforeEach(() => {
    prisma = {
      monitor: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new MonitorsService(prisma as never);
  });

  it('creates a monitor', async () => {
    const dto = { name: 'X', url: 'https://x.com' };
    prisma.monitor.create.mockResolvedValue({ id: '1', ...dto });

    await service.create(dto as never);

    expect(prisma.monitor.create).toHaveBeenCalledWith({ data: dto });
  });

  it('findOne throws NotFound when the monitor is missing', async () => {
    prisma.monitor.findUnique.mockResolvedValue(null);

    await expect(service.findOne('nope')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('findOne returns the monitor when found', async () => {
    prisma.monitor.findUnique.mockResolvedValue({ id: '1' });

    await expect(service.findOne('1')).resolves.toEqual({ id: '1' });
  });

  it('update verifies existence then updates', async () => {
    prisma.monitor.findUnique.mockResolvedValue({ id: '1' });
    prisma.monitor.update.mockResolvedValue({ id: '1', name: 'new' });

    await service.update('1', { name: 'new' } as never);

    expect(prisma.monitor.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: { name: 'new' },
    });
  });

  it('remove verifies existence then deletes', async () => {
    prisma.monitor.findUnique.mockResolvedValue({ id: '1' });

    await service.remove('1');

    expect(prisma.monitor.delete).toHaveBeenCalledWith({ where: { id: '1' } });
  });

  it('remove throws NotFound (and never deletes) when missing', async () => {
    prisma.monitor.findUnique.mockResolvedValue(null);

    await expect(service.remove('nope')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.monitor.delete).not.toHaveBeenCalled();
  });
});
