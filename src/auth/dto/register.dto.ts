import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Suave' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'voce@exemplo.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'uma-senha-forte', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;
}
