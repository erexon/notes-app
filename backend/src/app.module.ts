import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { DbService } from './db.service';
import { HealthController } from './health.controller';
import { NotesController } from './notes.controller';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 30,
        },
      ],
    }),
  ],
  controllers: [HealthController, AuthController, NotesController],
  providers: [DbService],
})
export class AppModule {}