import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ProcessTextRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  text: string;
}
