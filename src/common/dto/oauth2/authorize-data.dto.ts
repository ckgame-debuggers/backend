import { IsIn, IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class Oauth2AuthorizeData {
  @IsNotEmpty()
  @IsString()
  @IsIn(['authorization_code'])
  grant_type: 'authorization_code';

  @IsNotEmpty()
  @IsString()
  client_id: string;

  @IsNotEmpty()
  @IsString()
  client_secret: string;

  @IsNotEmpty()
  @IsString()
  @IsUrl()
  redirect_uri: string;

  @IsNotEmpty()
  @IsString()
  authorization_code: string;
}
