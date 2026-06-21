import { Injectable, NotFoundException } from '@nestjs/common';
import type { Monitor } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMonitorDto } from './dto/create-monitor.dto';
import { UpdateMonitorDto } from './dto/update-monitor.dto';

@Injectable()
export class MonitorsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateMonitorDto): Promise<Monitor> {
    return this.prisma.monitor.create({ data: dto });
  }

  findAll(): Promise<Monitor[]> {
    return this.prisma.monitor.findMany({ orderBy: { createdAt: 'asc' } });
  }

  async findOne(id: string): Promise<Monitor> {
    const monitor = await this.prisma.monitor.findUnique({ where: { id } });
    if (!monitor) {
      throw new NotFoundException(`Monitor "${id}" not found`);
    }
    return monitor;
  }

  async update(id: string, dto: UpdateMonitorDto): Promise<Monitor> {
    await this.findOne(id);
    return this.prisma.monitor.update({ where: { id }, data: dto });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.monitor.delete({ where: { id } });
  }
}
