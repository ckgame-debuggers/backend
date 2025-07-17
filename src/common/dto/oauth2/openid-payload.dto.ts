import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class Oauth2OpenIdPayloadDto {
  /**
   * Issuer - identifies principal that issued the JWT
   */
  @IsNotEmpty()
  @IsString()
  iss: string;

  /**
   * Audience - identifies the recipients that the JWT is intended for
   */
  @IsNotEmpty()
  @IsString()
  aud: string;

  /**
   * Subject - identifies the principal that is the subject of the JWT
   */
  @IsNotEmpty()
  @IsString()
  sub: string;

  /**
   * Issued At - identifies the time at which the JWT was issued
   */
  @IsNotEmpty()
  @IsString()
  iat: number;

  /**
   * Expiration Time - identifies the expiration time on or after which the JWT must not be accepted
   */
  @IsNotEmpty()
  @IsString()
  exp: number;

  /**
   * Nonce - associates client session with an ID Token to mitigate replay attacks
   */
  @IsOptional()
  @IsString()
  nonce?: string;

  /**
   * Username - user's username
   */
  @IsOptional()
  @IsString()
  username?: string;

  /**
   * Email - user's email address
   */
  @IsOptional()
  @IsString()
  email?: string;

  /**
   * School Number - user's school identification number
   */
  @IsOptional()
  @IsString()
  school_number?: string;
}
