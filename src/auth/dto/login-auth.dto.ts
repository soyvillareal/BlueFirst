import { IsEnum, IsJWT, IsNotEmpty, IsUUID } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

import { UpdateUserDto } from 'src/users/dto/update-user.dto';

import { ESessionAuthType } from './session-auth.dto';

export class LoginAuthDto {
  @ApiProperty({ required: true, description: 'Username or email' })
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  loginId: string;

  @IsNotEmpty()
  @ApiProperty({ required: true })
  password: string;
}

export class AnonymousLoginAuthDto {
  @IsNotEmpty()
  @ApiProperty({ required: true, default: 'empty', type: String })
  seed: 'empty';
}

export class LoginAuthResponseDto {
  @ApiProperty({ type: String, format: 'uuid' })
  @IsNotEmpty()
  @IsUUID()
  id: string;

  @ApiProperty({ enum: ESessionAuthType, default: ESessionAuthType.ANONYMOUS, enumName: 'ESessionAuthType' })
  @IsNotEmpty()
  @IsEnum(ESessionAuthType)
  type: ESessionAuthType;

  @ApiProperty({ type: UpdateUserDto, format: 'object' })
  @IsNotEmpty()
  user: UpdateUserDto;

  @ApiProperty({ type: String, format: 'jwt' })
  @IsNotEmpty()
  @IsJWT()
  jwt: string;

  @ApiProperty({ type: Date, format: 'date-time' })
  @IsNotEmpty()
  @Type(() => Date)
  expiredAt: Date;
}
