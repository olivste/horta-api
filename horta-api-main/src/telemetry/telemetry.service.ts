import { Injectable } from '@nestjs/common';
import { SensorType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryReadingDto } from './dto/query-reading.dto';

@Injectable()
export class TelemetryService {
  constructor(private readonly prisma: PrismaService) {}

  create(deviceId: string, type: SensorType, value: number, sensorLabel?: string) {
    return this.prisma.sensorReading.create({
      data: { deviceId, type, value, sensorLabel },
    });
  }

  findAll(userId: string, query: QueryReadingDto) {
    return this.prisma.sensorReading.findMany({
      where: {
        device: { userId },
        deviceId: query.deviceId,
        type: query.type,
        sensorLabel: query.sensorLabel,
        createdAt: {
          gte: query.from ? new Date(query.from) : undefined,
          lte: query.to ? new Date(query.to) : undefined,
        },
      },
      orderBy: { createdAt: 'desc' },
      include: { device: { select: { id: true, name: true } } },
      take: 500,
    });
  }

  /**
   * Ultima leitura de cada combinacao (device, type, sensorLabel) do usuario.
   * Um device pode ter mais de uma "ultima leitura" agora (ex: dois sensores
   * de umidade com sensorLabel diferente) - por isso latestReadings e um
   * array por device, nao mais um objeto unico como antes.
   */
  async findLatestPerDevice(userId: string) {
    const devices = await this.prisma.device.findMany({
      where: { userId },
      select: { id: true, name: true, isActive: true },
    });

    // distinct + orderBy (Postgres = DISTINCT ON) traz so a leitura mais
    // recente de cada combinacao (deviceId, type, sensorLabel)
    const latestReadings = await this.prisma.sensorReading.findMany({
      where: { device: { userId } },
      distinct: ['deviceId', 'type', 'sensorLabel'],
      orderBy: [
        { deviceId: 'asc' },
        { type: 'asc' },
        { sensorLabel: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return devices.map((device) => ({
      deviceId: device.id,
      deviceName: device.name,
      isActive: device.isActive,
      latestReadings: latestReadings
        .filter((reading) => reading.deviceId === device.id)
        .map((reading) => ({
          id: reading.id,
          type: reading.type,
          sensorLabel: reading.sensorLabel,
          value: reading.value,
          createdAt: reading.createdAt,
        })),
    }));
  }
}
