import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

import { RegisterAuthDto } from 'src/auth/dto/register-auth.dto';

export class UpdateUserDto extends PartialType(RegisterAuthDto) {
  @Exclude()
  @ApiProperty({ required: true, nullable: false })
  id: string;
}
