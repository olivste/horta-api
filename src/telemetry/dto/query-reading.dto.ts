import { IsEnum, IsISO8601, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SensorType } from '@prisma/client';

export class QueryReadingDto {
  @ApiPropertyOptional({ description: 'Filtra por device' })
  @IsOptional()
  @IsUUID()
  deviceId?: string;

  @ApiPropertyOptional({ enum: SensorType })
  @IsOptional()
  @IsEnum(SensorType)
  type?: SensorType;

  @ApiPropertyOptional({ description: 'Filtra por sensor especifico (quando o device tem mais de um do mesmo type)' })
  @IsOptional()
  @IsString()
  sensorLabel?: string;

  @ApiPropertyOptional({ example: '2026-09-01T00:00:00Z' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ example: '2026-09-10T00:00:00Z' })
  @IsOptional()
  @IsISO8601()
  to?: string;
}
