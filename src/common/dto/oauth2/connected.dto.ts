import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateConnectedDto {
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsNotEmpty()
  @IsUUID()
  clientId: string;
}

export class UpdateConnectedDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  clientId?: string;
}

export class GetConnectInfoDto {
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsString()
  @IsNotEmpty()
  redirectTo: string;
}

export class ConnectedResponseDto {
  id: string;
  userId: string;
  clientId: string;
  createdAt: Date;
  updatedAt: Date;
}
