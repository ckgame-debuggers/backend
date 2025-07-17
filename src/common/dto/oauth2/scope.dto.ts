import { IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';

export class CreateScopeDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  item: string;

  @IsNotEmpty()
  @IsBoolean()
  isEssential: boolean;
}

export class UpdateScopeEntityDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  item?: string;

  @IsOptional()
  @IsBoolean()
  isEssential?: boolean;
}

export class ScopeResponseDto {
  id: number;
  title: string;
  item: string;
  isEssential: boolean;
  createdAt: Date;
  updatedAt: Date;
}
