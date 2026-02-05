import { IsEmail, IsNotEmpty, MinLength, IsString } from 'class-validator';

export class RegisterAccountDto {
  @IsEmail()
  emailAddress: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;
}

export class LoginCredentialsDto {
  @IsEmail()
  emailAddress: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class TokenResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export class AccountProfileDto {
  id: string;
  emailAddress: string;
  fullName: string;
  accountRole: string;
  isActive: boolean;
}
