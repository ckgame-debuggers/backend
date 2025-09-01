import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CommunityNewPostDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(1, { message: '제목은 최소 1자 이상이어야 합니다.' })
  @MaxLength(100, { message: '제목은 100자를 초과할 수 없습니다.' })
  title: string;

  @IsNotEmpty()
  @IsNumber()
  category: number;

  @IsNotEmpty()
  @IsString()
  @MinLength(1, { message: '내용은 최소 1자 이상이어야 합니다.' })
  @MaxLength(10000, { message: '내용은 10000자를 초과할 수 없습니다.' })
  content: string;

  @IsOptional()
  @IsString()
  thumbnail?: string | null;

  @IsBoolean()
  isUnknown: boolean;
}
