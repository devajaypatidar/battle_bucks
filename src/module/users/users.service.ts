import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const { email, username, password } = createUserDto;

    // Check if user exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      throw new ConflictException('User with this email or username already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with wallet
    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        wallet: {
          create: {
            balance: 1000, // Starting gems
          },
        },
      },
      include: {
        wallet: true,
      },
    });

    return this.toResponseDto(user);
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { wallet: true },
    });
  }

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
      include: { wallet: true },
    });
  }

  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        wallet: true,
        characterProfiles: {
          where: { isActive: true },
          take: 5,
        },
        _count: {
          select: {
            purchases: true,
            inventory: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toResponseDto(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      include: { wallet: true },
    });

    return this.toResponseDto(user);
  }

  async validateUser(email: string, password: string) {
    const user = await this.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  private toResponseDto(user: any): UserResponseDto {
    const { password: _, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      gemBalance: user.wallet?.balance || 0,
    };
  }
}
