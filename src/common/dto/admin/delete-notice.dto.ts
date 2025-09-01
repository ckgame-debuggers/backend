import { IsNotEmpty, IsNumber } from 'class-validator';

export class AdminDeleteNoticeDto {
  @IsNotEmpty()
  @IsNumber()
  id: string;
}
