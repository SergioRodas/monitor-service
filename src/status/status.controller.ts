import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { StatusService } from './status.service';

@ApiTags('status')
@Controller('status')
export class StatusController {
  constructor(private readonly status: StatusService) {}

  @Get()
  @ApiOperation({ summary: 'Aggregated live status of all monitors' })
  getStatus() {
    return this.status.getStatus();
  }
}
