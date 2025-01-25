import { Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { Player, Room, Notification, NotificationType } from '../../interfaces/game.interface';

@Injectable()
export class GameService {
    private _rooms: Room[] = [];
    private _roomGameTime: number = 300; // 5 minutos

    constructor() { }

    private _findRoomByRoomId(roomId: string): Room | undefined {
        return this._rooms.find(room => room.id === roomId);
    }

    private _findRoomByPlayer(clientId: string): Room | undefined {
        return this._rooms.find(room => room.players.some(player => player.id === clientId))
    }

    private _findPlayer(clientId: string): Player | undefined {
        return this._findRoomByPlayer(clientId)?.players.find(player => player.id === clientId);
    }

    private _startTimer(
        client: Socket,
        room: Room,
        player: Player,
        emitCallback: (room: Room) => void,
        emitNotificationCallback: (roomId: string, notification?: Notification) => void,
        emitDisconnectPlayer: (playload: { roomId: string, playerId: string }) => void
    ) {
        player.isPlaying = true;
        player.timeToLose = 30;
        player.alreadyActed = false;

        // Limpe qualquer timer existente antes de iniciar um novo
        if (player.timerId) {
            clearInterval(player.timerId);
        }

        emitNotificationCallback(room.id, {
            title: "Status",
            message: `Jogador ${player.name} Começou a jogar`,
            type: NotificationType.dark,
            time: Date.now()
        });

        player.timerId = setInterval(() => {
            // Decrementar o tempo a cada segundo
            if (player.timeLeft > 0 && player.timeToLose > 0 && player.timeToLose <= 30) {
                player.timeToLose--;
                player.timeLeft--;

                emitCallback(room);
            } else {
                clearInterval(player.timerId);
                player.timerId = undefined;

                // O tempo acabou, encerrar o jogo
                this._removePlayer(client, room, player, emitCallback, emitNotificationCallback, emitDisconnectPlayer);
            }
        }, 1000); // Atualiza a cada 1 segundo
    }

    private _removePlayer(
        client: Socket,
        room: Room,
        player: Player,
        emitCallback: (room: Room) => void,
        emitNotificationCallback: (roomId: string, notification?: Notification) => void,
        emitDisconnectPlayer: (playload: { roomId: string, playerId: string }) => void
    ) {
        // Limpar o timer do jogador que será removido
        if (player.timerId) clearInterval(player.timerId);

        let isPlaying = player.isPlaying;

        // room.players = room.players.filter(roomPlayer => roomPlayer.id != player.id);

        emitNotificationCallback(room.id, {
            title: "Status",
            message: `Jogador ${player.name} foi removido do jogo`,
            type: NotificationType.danger,
            time: Date.now()
        });

        emitDisconnectPlayer({ roomId: room.id, playerId: player.id });

        if (isPlaying) {
            const nextPlayer = room.players[room.playerTurn - 1];

            if (nextPlayer) {
                return this._startTimer(client, room, nextPlayer, emitCallback, emitNotificationCallback, emitDisconnectPlayer)
            } else {
                if (room.players.length > 0) {
                    return this._startTimer(client, room, room.players[0], emitCallback, emitNotificationCallback, emitDisconnectPlayer);
                }
            }
        }
    }

    public createRoom(roomId: string, roomName: string) {
        this._rooms.push({
            id: roomId,
            name: roomName,
            gameStarted: false,
            gameFinished: false,
            playerTurn: 1,
            players: []
        });

        console.log("Room created:", this._rooms);
    }

    // GET
    public clearRoomById(roomId: string) {
        try {
            const room = this._findRoomByRoomId(roomId);
            
            if (room) {
                room.gameStarted = false;
                room.gameFinished = false;
                room.playerTurn = 1;
                room.players = [];
            }

            return "Room clear!";
        } catch (err) {
            return new Error("Impossible to find room!");
        }
    }

    public startGame(
        client: Socket,
        roomId: string,
        emitCallback: (timeRamaining: Room) => void,
        emitNotificationCallback: (roomId: string, notification?: Notification) => void,
        emitDisconnectPlayer: (playload: { playerId: string }) => void
    ) {
        const room = this._rooms.find(room => room.id === roomId);
        const player = this._findPlayer(client.id);

        if (room && player) {
            room.gameStarted = true;

            emitNotificationCallback(room.id, {
                title: "Status",
                type: NotificationType.success,
                message: "O jogo foi iniciado!",
                time: Date.now()
            })

            if (!player.timerId) {
                return this._startTimer(client, room, player, emitCallback, emitNotificationCallback, emitDisconnectPlayer);
            }
        }
    }

    public stopGame(roomId: string) {
        const room = this._findRoomByRoomId(roomId);

        if (room) {
            room.gameStarted = false;
        }
    }

    public increasePlayerTime({ clientId, seconds }: { clientId: string, seconds: number }) {
        let player = this._findPlayer(clientId);

        if (player) {
            player.timeLeft += seconds;
            player.alreadyActed = true;
        }
    }

    public decreasePlayerTime({ clientId, seconds }: { clientId: string, seconds: number }) {
        let room = this._findRoomByPlayer(clientId);

        let targetPlayer = room?.players.find(player => player.id === clientId);
        if (targetPlayer) {
            targetPlayer.timeLeft -= seconds;
        }

        let playerActing = room?.players.find(player => player.isPlaying);
        if (playerActing) {
            playerActing.alreadyActed = true;
        }
    }

    public endTurn(
        client: Socket,
        emitCallback: (room: Room) => void,
        emitNotificationCallback: (roomId: string, notification?: Notification) => void,
        emitDisconnectPlayer: (playload: { roomId: string, playerId: string }) => void
    ) {
        let room = this._findRoomByPlayer(client.id);
        let player = this._findPlayer(client.id);

        if (player && player.timerId) {
            clearInterval(player.timerId);

            player.timerId = undefined;
            player.timeToLose = 30;
            player.isPlaying = false;
            player.alreadyActed = false;
        }

        if (room) {
            room.playerTurn++;

            if (room?.playerTurn > room?.players.length) {
                room.playerTurn = 1;
            }

            return this._startTimer(client, room, room.players[room.playerTurn - 1], emitCallback, emitNotificationCallback, emitDisconnectPlayer);
        }
    }

    public addPlayerToRoom(roomId: string, player: { id: string, name?: string }) {
        const room = this._findRoomByRoomId(roomId);

        if (room) {
            let position = room.players.length + 1;
            let playerName = `Player ${position}`;

            while (room.players.some(player => player.name === playerName)) {
                position++;
                playerName = `Player ${position}`;
            }

            room.players.push({
                id: player.id,
                name: playerName,
                timeLeft: this._roomGameTime,
                timeToLose: 30,
                alreadyActed: false,
                isPlaying: false,
            });
        }
    }

    // Verify winner
    public verifyWinner(roomId: string) {
        const room = this._findRoomByRoomId(roomId);
        if (room?.gameStarted && room?.players.length === 1) {
            // this.clearRoomById(room.id);
            room.players[0].alreadyActed = false;
            clearInterval(room.players[0].timerId);
            room.gameFinished = true;

            return room.players[0];
        }

        return;
    }

    public disconnectPlayer(client: Socket, emitNotificationCallback: (roomId: string, notification?: Notification) => void,) {
        // Remover o jogador de todas as salas
        const playerRoom = this._findRoomByPlayer(client.id);
        const player = this._findPlayer(client.id);

        if (!playerRoom) {
            console.log(`O Jogador ${client.id} não encontrado em nenhuma sala.`);
            return;
        }

        // Filtra os jogadores para remover o jogador desconectado
        playerRoom.players = playerRoom.players.filter(player => player.id != client.id);

        if (playerRoom.players.length === 0) playerRoom.gameStarted = false;

        // Atualizar a lista de salas (_rooms)
        this._rooms = this._rooms.map(room =>
            room.id === playerRoom.id ? playerRoom : room
        );

        emitNotificationCallback(playerRoom.id, {
            title: "Status",
            message: `O Jogador ${player?.name} saiu da sala!`,
            time: Date.now(),
            type: NotificationType.danger
        });

        return playerRoom
    }

    public getRoomList() {
        return this._rooms;
    }

    public getRoom(roomId: string) {
        return this._findRoomByRoomId(roomId);
    }
}
