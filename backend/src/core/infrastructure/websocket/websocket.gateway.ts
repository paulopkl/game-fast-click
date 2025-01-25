import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from "socket.io";
import { GameService } from '../../domain/application/game/game.service';
import { OnModuleInit } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Notification, NotificationType } from "../../domain/interfaces/game.interface";

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:4200', // Update this to match your frontend
    methods: ['GET', 'POST'],
  }
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  @WebSocketServer() server: Server;

  constructor(private readonly gameService: GameService) { }

  // Garante que será chamado após o servidor Socket.IO estar pronto
  onModuleInit() {
    const roomId = uuidv4();

    try {
      this.server.sockets.adapter.rooms.set(roomId, new Set());

      this.gameService.createRoom(roomId, "Sala Principal");
    } catch (err) {
      console.error("Unable to create room on instance!");
    }
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Usuário ${client.id} desconectado!!`);

    const room = this.gameService.disconnectPlayer(client, (roomId, notification) => {
      this.server.to(roomId).emit("game_notification", notification);
    });

    console.log(client.id, { room });

    if (room) {
      this.server.to(room.id).emit("player_changed", room);

      const playerWinner = this.gameService.verifyWinner(room.id);

      if (playerWinner) {
        let notification: Notification = {
          title: "Status",
          time: Date.now(),
          message: `O Jogador ${playerWinner.name} venceu o jogo, Parabéns!!`,
          type: NotificationType.success
        }

        this.server.to(room.id).emit("game_notification", notification);
        this.server.to(room.id).emit("player_winner", playerWinner);
      }

      // this.server.emit("rooms_list", this.gameService.getRoomList());
    }
  }

  // Quando o cliente solicita as salas
  @SubscribeMessage('get_rooms')
  handleGetRooms(client: Socket): void {
    console.log(`Cliente ${client.id} solicitou as salas.`);

    this.server.emit('rooms_list', this.gameService.getRoomList()); // Responde apenas ao cliente solicitante
  }

  @SubscribeMessage('get_room')
  public getPlayersByRoom(client: Socket, roomId: string) {
    const room = this.gameService.getRoom(roomId);

    client.emit("room", room);
  }

  // Adiciona uma nova sala (se necessário)
  // @SubscribeMessage('add_room')
  // handleAddRoom(@MessageBody() roomName: string, client: Socket): void {
  //   const newRoom = { id: `${Date.now()}`, name: roomName, players: [] };
  //   this.rooms.push(newRoom);

  //   console.log(`Nova sala criada por ${client.id}: ${roomName}`);
  //   client.emit('rooms_list', this.rooms); // Atualiza apenas o cliente que criou a sala
  // }

  @SubscribeMessage('join_room')
  handleJoinRoom(client: Socket, { roomId, clientName }: { clientName: string, roomId: string }) {
    const player = {
      id: client.id,
      name: clientName,
    }

    this.gameService.addPlayerToRoom(roomId, player);

    client.join(roomId);
    console.log(`Client ${client.id} joined room '${roomId}'`);

    const room = this.gameService.getRoom(roomId);
    const rooms = this.gameService.getRoomList();

    this.server.to(roomId).emit("player_changed", room);

    this.server.emit("rooms_list", rooms);
  }

  @SubscribeMessage("start_game")
  public startGame(client: Socket, roomId: string) {
    this.gameService.startGame(
      client,
      roomId,
      (room) => {
        this.server.to(roomId).emit('game_summary', room);
        this.server.emit('rooms_list', this.gameService.getRoomList()); // Responde apenas ao cliente solicitante
      },
      (roomId, notification) => {
        this.server.to(roomId).emit("game_notification", notification);
      },
      (payload) => {
        this.server.to(roomId).emit("disconnectPlayer", payload)
      }
    );
  }

  @SubscribeMessage("increase_player_time")
  public increasePlayerTime(_client: Socket, data: { clientId: string, seconds: number }) {
    this.gameService.increasePlayerTime(data);
  }

  @SubscribeMessage("decrease_player_time")
  public decreasePlayerTime(_client: Socket, data: { clientId: string, seconds: number }) {
    this.gameService.decreasePlayerTime(data);
  }

  @SubscribeMessage("end_turn")
  public endTurn(client: Socket) {
    this.gameService.endTurn(
      client,
      room => {
        this.server.to(room.id).emit("game_summary", room);
      },
      (roomId, notification) => {
        this.server.to(roomId).emit("game_notification", notification);
      },
      ({ roomId, playerId }) => {
        this.server.to(roomId).emit("disconnectPlayer", { playerId })
      }
    );
  }
}
