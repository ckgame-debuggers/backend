import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAuthorizationCodeDto {
  @IsNotEmpty()
  @IsUUID()
  client_id: string;

  @IsUUID('4', { each: true })
  @IsOptional()
  agreed: string[];

  @IsString()
  @IsNotEmpty()
  redirect_to: string;

  @IsOptional()
  @IsString()
  nonce?: string;
}

export class UpdateAuthorizationCodeDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  client_id?: string;
}

export class AuthorizationCodeResponseDto {
  id: string;
  userId: string;
  clientId: string;
  createdAt: Date;
  updatedAt: Date;
}
