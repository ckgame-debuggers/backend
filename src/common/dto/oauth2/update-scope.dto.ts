import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class UpdateScopeDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  scopes: string[];
}
