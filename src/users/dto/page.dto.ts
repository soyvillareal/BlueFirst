import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

import { PageMetaDto } from './page-meta.dto';
import { UserPaginationDto } from './user-pagination.dto';

export class PageDto<T> {
  @IsArray()
  @ApiProperty({ isArray: true, type: () => UserPaginationDto })
  readonly data: T[];

  @ApiProperty({ type: () => PageMetaDto })
  readonly meta: PageMetaDto;

  constructor(data: T[], meta: PageMetaDto) {
    this.data = data;
    this.meta = meta;
  }
}
