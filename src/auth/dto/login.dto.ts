import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'voce@exemplo.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'uma-senha-forte', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;
}
