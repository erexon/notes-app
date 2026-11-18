import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { createToken } from './auth';
import { DbService } from './db.service';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private db: DbService) { }

  @Post('register')
  async register(@Body() body: { username: string; password: string }) {
    if (
      typeof body?.username !== 'string' ||
      !body.username.trim() ||
      typeof body?.password !== 'string' ||
      !body.password
    ) {
      throw new BadRequestException('Completează utilizatorul și parola');
    }

    // Varianta 8: minimum 10 caractere
    if (body.password.length < 10) {
      throw new BadRequestException(
        'Parola trebuie să aibă minimum 10 caractere',
      );
    }

    // Salvăm hash-ul, nu parola originală
    const hash = await bcrypt.hash(body.password, 10);

    try {
      const result = await this.db.query(
        'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
        [body.username, hash],
      );

      const user = result.rows[0];
      return { token: createToken(user), username: user.username };
    } catch {
      throw new BadRequestException('Utilizatorul există deja');
    }
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('login')
  async login(@Body() body: { username: string; password: string }) {
    if (
      typeof body?.username !== 'string' ||
      typeof body?.password !== 'string'
    ) {
      throw new UnauthorizedException('Utilizator sau parolă greșită');
    }

    // Căutăm utilizatorul printr-o interogare parametrizată
    const result = await this.db.query(
      'SELECT id, username, password FROM users WHERE username = $1',
      [body.username],
    );

    const user = result.rows[0];

    // Comparăm parola introdusă cu hash-ul salvat
    if (!user || !(await bcrypt.compare(body.password, user.password))) {
      throw new UnauthorizedException('Utilizator sau parolă greșită');
    }

    return { token: createToken(user), username: user.username };
  }
}