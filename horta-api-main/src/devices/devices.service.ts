import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DevicesService {
  constructor(private readonly prisma: PrismaService) {}

  private generateApiKey(): string {
    // 32 bytes -> 64 chars hex, prefixado para facilitar identificacao em logs
    return `esp_${randomBytes(32).toString('hex')}`;
  }

  create(userId: string, name: string, hardwareId?: string) {
    if (hardwareId) {
      return this.upsertByHardwareId(userId, name, hardwareId);
    }
    return this.prisma.device.create({
      data: { name, userId, apiKey: this.generateApiKey() },
    });
  }

  /**
   * Se o hardwareId ja existe e pertence ao mesmo usuario: e um re-pareamento
   * (atualiza nome, reativa e gera apiKey nova). Se pertence a outro usuario: recusa.
   */
  private async upsertByHardwareId(userId: string, name: string, hardwareId: string) {
    const existing = await this.prisma.device.findUnique({ where: { hardwareId } });

    if (existing) {
      if (existing.userId !== userId) {
        throw new ConflictException('Esse device ja esta pareado com outra conta');
      }
      return this.prisma.device.update({
        where: { id: existing.id },
        data: { name, isActive: true, apiKey: this.generateApiKey() },
      });
    }

    return this.prisma.device.create({
      data: { name, hardwareId, userId, apiKey: this.generateApiKey() },
    });
  }

  findAll(userId: string) {
    return this.prisma.device.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const device = await this.prisma.device.findFirst({ where: { id, userId } });
    if (!device) throw new NotFoundException('Device nao encontrado');
    return device;
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.device.delete({ where: { id } });
  }

  async toggleActive(userId: string, id: string, isActive: boolean) {
    await this.findOne(userId, id);
    return this.prisma.device.update({ where: { id }, data: { isActive } });
  }

  async rotateApiKey(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.device.update({
      where: { id },
      data: { apiKey: this.generateApiKey() },
    });
  }

  /**
   * O proprio ESP se desativando (chamado com sua apiKey, sem JWT/userId).
   * Nao precisa checar dono - a apiKey ja e a prova de que e o device certo.
   */
  deactivateSelf(id: string) {
    return this.prisma.device.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
