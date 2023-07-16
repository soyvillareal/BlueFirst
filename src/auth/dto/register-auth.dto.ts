import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { IsAdult } from '../auth.decorator';

export enum EUserGender {
  MALE = 'male',
  FEMALE = 'female',
}

export class RegisterAuthDto {
  @ApiPropertyOptional({ nullable: true })
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  firstName: string;

  @ApiPropertyOptional({ nullable: true })
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  lastName: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(25)
  @Matches(/[a-zA-Z0-9_-]{5,25}/, { message: 'username must be alphanumeric and can contain _ and -' })
  username: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(30)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/, {
    message: 'password must contain at least 1 uppercase letter, 1 lowercase letter and 1 number',
  })
  password: string;

  @ApiPropertyOptional({ required: true, nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsAdult(new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 365 * 18)) // Min 18 years old
  birthdate: Date;

  @ApiProperty({ required: true, enum: EUserGender })
  @IsString()
  @IsNotEmpty()
  @IsEnum(EUserGender)
  gender: EUserGender;
}
