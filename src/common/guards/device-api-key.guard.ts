import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Autentica um ESP pela propria apiKey (header x-device-key), sem envolver
 * login de usuario/JWT. Usado em qualquer rota que o proprio device chama
 * sozinho (ex: enviar telemetria, se auto-desativar).
 */
@Injectable()
export class DeviceApiKeyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-device-key'];

    if (!apiKey || typeof apiKey !== 'string') {
      throw new UnauthorizedException('Header x-device-key ausente');
    }

    const device = await this.prisma.device.findUnique({ where: { apiKey } });

    if (!device || !device.isActive) {
      throw new UnauthorizedException('Device nao autorizado');
    }

    // disponibiliza o device autenticado para o controller/service
    request.device = device;
    return true;
  }
}
