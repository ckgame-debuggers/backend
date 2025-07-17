import { IsNotEmpty, IsOptional, IsUUID, IsNumber } from 'class-validator';

export class CreateAgreedDto {
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @IsNotEmpty()
  @IsNumber()
  scopeId: number;

  @IsUUID()
  connectedId?: string;
}

export class UpdateAgreedDto {
  @IsOptional()
  @IsNumber()
  scopeId?: number;

  @IsOptional()
  @IsUUID()
  connectedId?: string;
}

export class AgreedResponseDto {
  id: string;
  scopeId: number;
  connectedId: string;
  createdAt: Date;
  updatedAt: Date;
}
