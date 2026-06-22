import { Module } from '@nestjs/common';
import { ChecksController } from './checks.controller';
import { ChecksService } from './checks.service';
import { CheckerService } from './checker.service';

@Module({
  controllers: [ChecksController],
  providers: [ChecksService, CheckerService],
  exports: [CheckerService, ChecksService],
})
export class ChecksModule {}
