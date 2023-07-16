import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsJWT, IsNotEmpty, IsUUID } from 'class-validator';

export enum ESessionAuthType {
  AUTH = 'auth',
  ANONYMOUS = 'anonymous',
}

export class AnonymousAuthDto {
  @ApiProperty({ type: String, format: 'uuid' })
  @IsNotEmpty()
  @IsUUID()
  id: string;

  @ApiProperty({ type: String, format: 'uuid' })
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty({ enum: ESessionAuthType, default: ESessionAuthType.ANONYMOUS, enumName: 'ESessionAuthType' })
  @IsEnum(ESessionAuthType)
  type: ESessionAuthType;

  @ApiProperty({ type: String, format: 'jwt' })
  @IsNotEmpty()
  @IsJWT()
  jwt: string;

  @ApiProperty({ type: Date, format: 'date-time' })
  @IsNotEmpty()
  @Type(() => Date)
  expiredAt: Date;
}
