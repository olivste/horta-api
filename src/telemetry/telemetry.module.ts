import { Module } from '@nestjs/common';
import { TelemetryController } from './telemetry.controller';
import { TelemetryService } from './telemetry.service';
import { DeviceApiKeyGuard } from '../common/guards/device-api-key.guard';

@Module({
  controllers: [TelemetryController],
  providers: [TelemetryService, DeviceApiKeyGuard],
})
export class TelemetryModule {}
