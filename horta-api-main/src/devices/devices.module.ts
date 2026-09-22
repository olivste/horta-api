import { Module } from '@nestjs/common';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { DeviceApiKeyGuard } from '../common/guards/device-api-key.guard';

@Module({
  controllers: [DevicesController],
  providers: [DevicesService, DeviceApiKeyGuard],
  exports: [DevicesService],
})
export class DevicesModule {}
