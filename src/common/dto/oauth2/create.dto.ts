import { IsNotEmpty } from 'class-validator';

export class CreateOauth2Dto {
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  profile: string;
}
