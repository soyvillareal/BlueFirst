import { ApiProperty } from '@nestjs/swagger';

import { EUserGender } from 'src/auth/dto/register-auth.dto';

export class UserPaginationDto {
  @ApiProperty({ required: true, nullable: false })
  id: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ nullable: true })
  firstName: string;

  @ApiProperty({ nullable: true })
  lastName: string;

  @ApiProperty({ nullable: true })
  avatar: string;

  @ApiProperty({ nullable: true })
  birthdate: Date;

  @ApiProperty()
  gender: EUserGender;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  createdAt: Date;
}
