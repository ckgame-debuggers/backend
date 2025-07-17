import { IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';

export class CreateClientDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  profile: string;

  @IsNotEmpty()
  @IsString()
  secret: string;
}

export class UpdateClientDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  profile?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  secret?: string;
}

export class ClientResponseDto {
  id: string;
  title: string;
  profile: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ClientWithSecretResponseDto {
  id: string;
  title: string;
  profile: string;
  secret: string;
  createdAt: Date;
  updatedAt: Date;
}
