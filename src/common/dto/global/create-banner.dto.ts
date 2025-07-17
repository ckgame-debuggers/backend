import { IsNotEmpty } from 'class-validator';

export class CreateBannerDto {
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  desription: string;

  @IsNotEmpty()
  image: string;

  @IsNotEmpty()
  url: string;

  visible: boolean = false;
}
