import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SensorType } from '@prisma/client';

export class CreateReadingDto {
  @ApiProperty({ enum: SensorType, example: SensorType.SOIL_HUMIDITY })
  @IsEnum(SensorType)
  type: SensorType;

  @ApiProperty({ example: 42.5, description: 'Valor da leitura (unidade depende do type)' })
  @IsNumber()
  value: number;

  @ApiPropertyOptional({
    description:
      'So precisa enviar quando o device tem mais de um sensor do mesmo type (ex: dois sensores de umidade). Sensores unicos (luz, temperatura) podem omitir.',
    example: 'sensor-1',
  })
  @IsOptional()
  @IsString()
  sensorLabel?: string;
}
