import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Device } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';
import { DeviceApiKeyGuard } from '../common/guards/device-api-key.guard';
import { TelemetryService } from './telemetry.service';
import { CreateReadingDto } from './dto/create-reading.dto';
import { QueryReadingDto } from './dto/query-reading.dto';

@ApiTags('telemetry')
@Controller('telemetry')
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  // Usado pelo ESP32 - autenticado por API key propria do device, nao por JWT de usuario
  @ApiSecurity('device-key')
  @ApiOperation({ summary: '[ESP] Envia uma leitura de sensor (autenticado por x-device-key)' })
  @UseGuards(DeviceApiKeyGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  ingest(@Body() dto: CreateReadingDto, @Req() req: Request & { device: Device }) {
    return this.telemetryService.create(req.device.id, dto.type, dto.value, dto.sensorLabel);
  }

  // Usado pelo dashboard - autenticado por JWT do usuario, escopado aos devices dele
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: '[Dashboard] Lista leituras dos devices do usuario logado, com filtros' })
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() query: QueryReadingDto) {
    return this.telemetryService.findAll(user.userId, query);
  }

  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: '[Dashboard] Ultima leitura de cada device do usuario logado' })
  @UseGuards(JwtAuthGuard)
  @Get('latest')
  findLatest(@CurrentUser() user: AuthUser) {
    return this.telemetryService.findLatestPerDevice(user.userId);
  }
}
