import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(1000, { message: '댓글은 1000자를 초과할 수 없습니다.' })
  content: string;

  @IsOptional()
  @IsBoolean()
  isUnknown?: boolean;

  @IsOptional()
  parentId?: number;
}
