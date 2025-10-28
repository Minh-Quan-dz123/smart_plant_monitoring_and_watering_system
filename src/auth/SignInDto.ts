import { IsNotEmpty, Matches } from 'class-validator';

export class SignInDto {
  @IsNotEmpty({ message: 'email not empty' })
  @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
    message: 'email not valid',
  })
  email: string;
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/, {
    message: 'password not valid',
  })
  @IsNotEmpty({ message: 'password not Empty' })
  password: string;
}
