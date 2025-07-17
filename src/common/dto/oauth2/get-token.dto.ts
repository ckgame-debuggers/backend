import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class Oauth2GetTokenDto {
  @IsNotEmpty()
  @IsString()
  grant_type: string;

  @IsNotEmpty()
  @IsString()
  @IsUUID()
  client_id: string;

  @IsNotEmpty()
  @IsString()
  client_secret: string;

  @IsNotEmpty()
  @IsString()
  @IsUUID()
  code?: string;

  @IsOptional()
  @IsString()
  refresh_token?: string;
}
