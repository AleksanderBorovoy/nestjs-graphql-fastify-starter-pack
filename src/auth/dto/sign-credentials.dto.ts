import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class SignCredentialsDto {
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  password: string;

  @IsString()
  @Matches(
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
    { message: 'email is invalid' },
  )
  email: string;
}
