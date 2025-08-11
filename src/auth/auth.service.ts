import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../module/users/users.service';
import { PrismaService } from '../module/database/prisma.service';
import { RegisterDto, LoginDto, RefreshTokenDto, AuthResponseDto } from './auth.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const user = await this.usersService.create(registerDto);
    const tokens = await this.generateTokens(user.id, user.email);
    
    // Store refresh token hash
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        gemBalance: user.gemBalance,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      ...tokens,
    };
  }

  async validateUser(email: string, password: string) {
    return this.usersService.validateUser(email, password);
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;
    
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email);
    
    // Store refresh token hash
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

    const userWithWallet = await this.usersService.findById(user.id);
    return {
      user: {
        id: userWithWallet!.id,
        email: userWithWallet!.email,
        username: userWithWallet!.username,
        gemBalance: userWithWallet!.gemBalance,
        createdAt: userWithWallet!.createdAt,
        updatedAt: userWithWallet!.updatedAt,
      },
      ...tokens,
    };
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    const { refreshToken } = refreshTokenDto;
    
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { wallet: true },
      });

      if (!user || !user.refreshTokenHash) {
        throw new UnauthorizedException('Access denied');
      }

      const refreshTokenMatches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
      if (!refreshTokenMatches) {
        throw new UnauthorizedException('Access denied');
      }

      const tokens = await this.generateTokens(user.id, user.email);
      await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

      const userWithWallet = await this.usersService.findById(user.id);
      return {
        user: {
          id: userWithWallet!.id,
          email: userWithWallet!.email,
          username: userWithWallet!.username,
          gemBalance: userWithWallet!.gemBalance,
          createdAt: userWithWallet!.createdAt,
          updatedAt: userWithWallet!.updatedAt,
        },
        ...tokens,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<{ message: string }> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });

    return { message: 'Logged out successfully' };
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { email, sub: userId };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
    };
  }

  private async updateRefreshTokenHash(userId: string, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: hashedRefreshToken },
    });
  }
}