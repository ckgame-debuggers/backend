import { IsNotEmpty, IsString } from 'class-validator';

export class DebuggersCommentDto {
  @IsNotEmpty()
  @IsString()
  contents: string;
}
