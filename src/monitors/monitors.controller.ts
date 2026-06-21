import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MonitorsService } from './monitors.service';
import { CreateMonitorDto } from './dto/create-monitor.dto';
import { UpdateMonitorDto } from './dto/update-monitor.dto';

@ApiTags('monitors')
@Controller('monitors')
export class MonitorsController {
  constructor(private readonly monitors: MonitorsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a monitor' })
  create(@Body() dto: CreateMonitorDto) {
    return this.monitors.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all monitors' })
  findAll() {
    return this.monitors.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single monitor' })
  findOne(@Param('id') id: string) {
    return this.monitors.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a monitor' })
  update(@Param('id') id: string, @Body() dto: UpdateMonitorDto) {
    return this.monitors.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a monitor' })
  remove(@Param('id') id: string) {
    return this.monitors.remove(id);
  }
}
