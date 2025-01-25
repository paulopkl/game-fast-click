import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { WebsocketGateway } from 'src/core/infrastructure/websocket/websocket.gateway';
import { GameController } from './game.controller';

@Module({
  controllers: [GameController],
  providers: [GameService, WebsocketGateway],
  exports: [GameService]
})
export class GameModule {}
