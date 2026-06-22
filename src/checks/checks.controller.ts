import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChecksService } from './checks.service';

@ApiTags('checks')
@Controller()
export class ChecksController {
  constructor(private readonly checks: ChecksService) {}

  @Post('monitors/:id/check')
  @ApiOperation({ summary: 'Probe one monitor now' })
  checkNow(@Param('id') id: string) {
    return this.checks.checkNow(id);
  }

  @Get('monitors/:id/checks')
  @ApiOperation({ summary: 'Recent check history for a monitor' })
  history(@Param('id') id: string) {
    return this.checks.recentChecks(id);
  }

  @Post('checks/run')
  @ApiOperation({ summary: 'Probe all enabled monitors now' })
  runAll() {
    return this.checks.checkAllNow();
  }
}
