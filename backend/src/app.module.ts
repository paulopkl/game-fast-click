import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GameModule } from './core/domain/application/game/game.module';
import { GameController } from './core/domain/application/game/game.controller';

@Module({
  imports: [GameModule],
  controllers: [AppController, GameController],
  providers: [AppService],
})
export class AppModule {}
