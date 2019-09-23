import { IsString, Matches } from 'class-validator';

export class SetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'password too weak',
  })
  newpassword: string;
}
