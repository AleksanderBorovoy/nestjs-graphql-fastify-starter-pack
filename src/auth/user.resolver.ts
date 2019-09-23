import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { User } from './user.entity';
import { SignCredentialsDto } from './dto/sign-credentials.dto';
import { UseGuards, Body, Logger } from '@nestjs/common';
import { GqlAuthGuard } from './auth.guard';
import { User as CurrentUser } from './get-user.decorator';
import { ForgotPasswordDto } from './dto/forgot-password-dto';
import { SetPasswordDto } from './dto/set-password.dto';

@Resolver('User')
export class UserResolver {
  private logger = new Logger('UserResolver');
  constructor(private authService: AuthService) {}

  @Mutation()
  createUser(@Args('data')
  {
    username,
    email,
    password,
  }: AuthCredentialsDto): Promise<User> {
    const authCredentialsDto: AuthCredentialsDto = {
      username,
      email,
      password,
    };
    return this.authService.signUp(authCredentialsDto);
  }

  @Mutation()
  signIn(@Args('data') { email, password }: SignCredentialsDto): Promise<
    string
  > {
    const signCredentialsDto: SignCredentialsDto = {
      email,
      password,
    };
    return this.authService.signIn(signCredentialsDto);
  }

  @Mutation()
  @UseGuards(GqlAuthGuard)
  changePassword(
    @CurrentUser() user: User,
    @Args('data') { password, newpassword }: any,
  ): Promise<User> {
    const email = user.email;
    const changePasswordDto = {
      password,
      newpassword,
      email,
    };
    this.logger.verbose(`User "${user.email}" is changing password.`);

    return this.authService.changePassword(changePasswordDto);
  }

  @Mutation()
  forgotPassword(@Args('data') { email }: ForgotPasswordDto): Promise<string> {
    const changePasswordDto = { email };
    return this.authService.forgotPassword(changePasswordDto);
  }

  @Mutation()
  setPassword(@Args('data') { token, newpassword }: SetPasswordDto): Promise<
    User
  > {
    const setPasswordDto = { token, newpassword };
    return this.authService.resetPassword(setPasswordDto);
  }
}
