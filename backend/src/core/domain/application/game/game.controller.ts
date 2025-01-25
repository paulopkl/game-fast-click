import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { GameService } from './game.service';
import { WebsocketGateway } from 'src/core/infrastructure/websocket/websocket.gateway';

@Controller('game')
export class GameController {
    constructor(private readonly gameService: GameService) {}

    @Get('clear-room/:roomId')
    getPlayers(@Param('roomId') roomId: string, @Res() res: Response) {
        const result = this.gameService.clearRoomById(roomId);

        // this.socketService.server.emit("rooms_list", this.gameService.getRoomList());

        return res.status(200).json(result);
    }
}
