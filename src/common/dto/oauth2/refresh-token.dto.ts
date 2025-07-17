import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
} from 'class-validator';

export class CreateRefreshTokenDto {
  @IsNotEmpty()
  @IsString()
  value: string;

  @IsNotEmpty()
  @IsDateString()
  exp: string;

  @IsNotEmpty()
  @IsUUID()
  clientId: string;

  @IsNotEmpty()
  @IsUUID()
  userId: string;
}

export class RevokeTokenDto {
  @IsOptional()
  @IsString()
  value?: string;
}

export class RefreshTokenResponseDto {
  id: number;
  value: string;
  exp: Date;
  clientId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
