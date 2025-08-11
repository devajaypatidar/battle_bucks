import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, Matches, IsNotEmpty } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'player@battlebucks.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    description: 'Unique username',
    example: 'PlayerOne',
    minLength: 3,
    maxLength: 30,
  })
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(30, { message: 'Username must not exceed 30 characters' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Username can only contain letters, numbers, underscores, and hyphens',
  })
  username: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePassword123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  password: string;
}

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'player@battlebucks.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePassword123!',
  })
  @IsString()
  @MinLength(1, { message: 'Password is required' })
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class UserResponseDto {
  @ApiProperty({
    description: 'User unique identifier',
    example: 'clp123456789',
  })
  id: string;

  @ApiProperty({
    description: 'User email address',
    example: 'player@battlebucks.com',
  })
  email: string;

  @ApiProperty({
    description: 'Username',
    example: 'PlayerOne',
  })
  username: string;

  @ApiProperty({
    description: 'Current gem balance',
    example: 1500,
  })
  gemBalance: number;

  @ApiProperty({
    description: 'Account creation date',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last account update',
    example: '2024-01-15T10:30:00Z',
  })
  updatedAt: Date;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'User information',
    type: UserResponseDto,
  })
  user: UserResponseDto;

  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Token type',
    example: 'Bearer',
  })
  tokenType: string;

  @ApiProperty({
    description: 'Token expiration time',
    example: '15m',
  })
  expiresIn: string;
}