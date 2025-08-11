import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, Matches, IsOptional } from 'class-validator';

export class CreateUserDto {
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

export class UpdateUserDto {
  @ApiProperty({
    description: 'Username',
    example: 'NewPlayerName',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_-]+$/)
  username?: string;
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