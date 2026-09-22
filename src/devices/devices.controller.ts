import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Device } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';
import { DeviceApiKeyGuard } from '../common/guards/device-api-key.guard';
import { DevicesService } from './devices.service';
import { CreateDeviceDto } from './dto/create-device.dto';

@ApiTags('devices')
@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  // Usado pelo proprio ESP - autenticado por apiKey (x-device-key), sem JWT/login.
  // Fica ANTES das rotas com :id de proposito, e usa um path literal ("self")
  // que nao colide com elas.
  @ApiSecurity('device-key')
  @ApiOperation({
    summary:
      '[ESP] Desativa o proprio device (autenticado por x-device-key, sem JWT). Usado quando o usuario aperta "Desconectar" na tela da placa.',
  })
  @UseGuards(DeviceApiKeyGuard)
  @Patch('self/deactivate')
  deactivateSelf(@Req() req: Request & { device: Device }) {
    return this.devicesService.deactivateSelf(req.device.id);
  }

  // A partir daqui, rotas do dashboard/app - autenticadas por JWT do usuario.
  @ApiBearerAuth('jwt')
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({
    summary:
      'Cadastra um ESP (do usuario logado) e gera a apiKey dele. Se enviar hardwareId de um device ja existente do mesmo usuario, re-pareia (gera key nova) em vez de duplicar.',
  })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateDeviceDto) {
    // apiKey so aparece na resposta de criacao - guarde nesse momento
    // para configurar no firmware do ESP (ou entregar via BLE, no fluxo do app)
    return this.devicesService.create(user.userId, dto.name, dto.hardwareId);
  }

  @ApiBearerAuth('jwt')
  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Lista os devices do usuario logado' })
  findAll(@CurrentUser() user: AuthUser) {
    return this.devicesService.findAll(user.userId);
  }

  @ApiBearerAuth('jwt')
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Detalhe de um device do usuario logado' })
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.devicesService.findOne(user.userId, id);
  }

  @ApiBearerAuth('jwt')
  @UseGuards(JwtAuthGuard)
  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Ativa ou desativa um device do usuario logado' })
  toggle(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.devicesService.toggleActive(user.userId, id, isActive);
  }

  @ApiBearerAuth('jwt')
  @UseGuards(JwtAuthGuard)
  @Patch(':id/rotate-key')
  @ApiOperation({ summary: 'Gera uma nova apiKey para o device (invalida a anterior)' })
  rotateKey(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.devicesService.rotateApiKey(user.userId, id);
  }

  @ApiBearerAuth('jwt')
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Remove um device do usuario logado e suas leituras' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.devicesService.remove(user.userId, id);
  }
}
