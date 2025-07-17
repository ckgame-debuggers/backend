import {
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsNumber,
} from 'class-validator';

export class CreateToAgreeDto {
  @IsNotEmpty()
  @IsUUID()
  clientId: string;

  @IsNotEmpty()
  @IsNumber()
  scopeId: number;

  @IsNotEmpty()
  @IsBoolean()
  isEssential: boolean;
}

export class UpdateToAgreeDto {
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsNumber()
  scopeId?: number;

  @IsOptional()
  @IsBoolean()
  isEssential?: boolean;
}

export class ToAgreeResponseDto {
  id: string;
  clientId: string;
  scopeId: number;
  isEssential: boolean;
  createdAt: Date;
  updatedAt: Date;
}
