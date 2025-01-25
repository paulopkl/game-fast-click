import { CommonModule } from '@angular/common'
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { Subscription } from 'rxjs'
import { SocketService } from '../../../../infrastructure/services/websocket/socket.service'
import { ToastStackComponent, Notification } from '../toast-stack/toast-stack.component'
import { Player, Room } from '../../models/game.interface'

@Component({
  selector: 'app-game',
  imports: [CommonModule, ToastStackComponent],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css'
})
export class GameComponent implements OnInit, OnDestroy {
  @ViewChild(ToastStackComponent) toastStack!: ToastStackComponent;

  playerId!: string;
  roomId!: string;
  room!: Room;
  private routeSub!: Subscription;

  constructor(private router: Router, private route: ActivatedRoute, private socketService: SocketService) { }

  ngOnInit(): void {
    // Subscribe to route changes to detect parameter updates
    this.routeSub = this.route.paramMap.subscribe((params) => {
      this.roomId = params.get('roomId') || ''
    })

    this.playerId = this.socketService.getClientId() as string

    this.socketService.getRoom(this.roomId, (receivedRoom: any) => {
      if (!receivedRoom) {
        // Navegar para a página raiz
        this.router.navigate(['/'])
      }

      this.room = receivedRoom
    })

    // Escuta atualizações da sala
    this.socketService.on('player_changed').subscribe((updatedRoom: Room) => {
      if (updatedRoom?.id === this.roomId) {
        console.log('Room updated:', updatedRoom)
        this.room = updatedRoom
      }
    })

    this.socketService.on('game_summary').subscribe((summarizedRoom: Room) => {
      if (summarizedRoom.id === this.roomId) this.room = summarizedRoom
    })

    this.socketService.on('game_notification').subscribe((notification: Notification) => {
      this.showToast(notification);
    })

    this.socketService.on("disconnectPlayer").subscribe(({ playerId }) => {
      console.log(playerId, this.playerId);

      if (playerId == this.playerId) {
        // alert("Você foi desconectado");

        // Navegar para a página raiz
        this.router.navigate(['/']).then(() => {
          // Recarregar a página após redirecionamento
          window.location.reload();
        });
      }
    });

    this.socketService.on("player_winner").subscribe((playerWinner) => {
      console.log(playerWinner);
    });
  }

  public convertMinutesToTime(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 60) // Divide os minutos por 60 para obter as horas
    const minutes = totalSeconds % 60 // Obtém o restante como minutos

    if (minutes === 0) {
      return `${hours} minutos` // Retorna apenas as horas se não houver minutos restantes
    } else {
      return `${hours} minutos e ${minutes} segundos` // Retorna horas e minutos
    }
  }

  public getPlayerTime(playerId: string): number {
    // Verifica se existe a sala e se o jogador está presente
    const player = this.room?.players?.find((player) => player.id === playerId);

    if (player) return player.timeLeft ? player.timeLeft : 0
    else return 0
  }

  public playerTimeRamaining(playerId: string): number {
    // Verifica se existe a sala e se o jogador está presente
    const player = this.room.players.find((player) => player.id === playerId)

    if (player) return player.timeToLose ? player.timeToLose : 0
    else return 0
  }

  public isYourTurn(playerId: string) {
    const playerPosition = this.room.players.findIndex((player) => player.id === playerId)

    return (
      this.room.players.length > 0 && playerPosition == this.room.playerTurn-1
    )
  }

  public resumeGame() {
    this.socketService.startGame(this.roomId)
  }

  public earnTime(playerId: string) {
    this.socketService.increaseTime(playerId)
  }

  public removeAnotherPlayerTime(playerId: string) {
    this.socketService.decreasePlayerTime(playerId);
  }

  public playerAlreadyActed(playerId: string) {
    return this.room.players.find((player) => player.id === playerId)
      ?.alreadyActed
  }

  public endTurn() {
    this.socketService.endTurn();
  }

  public showToast(toastInfo: Notification) {
    if (this.toastStack) {
      this.toastStack.addToast(toastInfo);
    } else {
      console.error('ToastStackComponent is not available.');
    }
  }

  trackByPlayerId(index: number, player: Player): string {
    return player.id;
  }

  public exitGame() {
    this.socketService.disconnect();

    this.router.navigate(['/']).then(() => {
      window.location.reload();
    });
  }

  ngOnDestroy(): void {
    // Limpar a inscrição quando o componente for destruído
    if (this.routeSub) {
      this.routeSub.unsubscribe()
    }
  }
}
