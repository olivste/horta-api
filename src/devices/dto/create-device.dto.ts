import { IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDeviceDto {
  @ApiProperty({ example: 'Horta - Vaso 1' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({
    description:
      'Identificador do hardware (ex: MAC address do ESP, sem separadores, maiusculo). Se enviado e ja existir um device com esse hardwareId, reaproveita o registro e gera uma apiKey nova (re-pareamento) em vez de duplicar.',
    example: 'AABBCCDDEEFF',
  })
  @IsOptional()
  @IsString()
  hardwareId?: string;
}
