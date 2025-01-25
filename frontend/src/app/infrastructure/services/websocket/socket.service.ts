import { Injectable } from '@angular/core'
import { NavigationStart, Router } from '@angular/router'
import { Observable } from 'rxjs'
import { io, Socket } from 'socket.io-client'
import { Location } from '@angular/common'
import { environment } from '../../../core/domain/application/environments/environment'

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket

  constructor(
    private router: Router,
    private _location: Location
  ) {
    this.socket = io(String(environment.API_URL) ?? 'http://localhost:3000/', {
      transports: ['websocket']
    })

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server:', this.socket.id)
    })

    this.socket.on('connect_error', (err) => {
      console.error('Connection error:', err.message)
    })

    // Detectar desconexão automática do navegador
    window.addEventListener('beforeunload', () => {
      this.disconnect()
    })

    // Listen to route changes to handle back navigation
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        // If navigating to the previous page
        if (this._location.isCurrentPathEqualTo(event.url)) {
          this.disconnect()
        }
      }
    })
  }

  public startGame(roomId: string) {
    this.socket.emit('start_game', roomId)
  }

  public getClientId() {
    return this.socket.id
  }

  public getRooms() {
    this.socket.emit('get_rooms') // Solicita as salas
  }

  public getRoom(roomId: string, callback: (rooms: any) => void) {
    console.log('enviando', { roomId })
    this.socket.emit('get_room', roomId) // Solicita as salas
    this.socket.once('room', callback) // Escuta a resposta apenas uma vez
  }

  public joinRoom(roomId: string, clientName: string) {
    this.socket.emit('join_room', { roomId, clientName })
  }

  public increaseTime(playerId: string) {
    this.socket.emit('increase_player_time', { clientId: playerId, seconds: 5 })
  }

  public decreasePlayerTime(playerId: string) {
    this.socket.emit("decrease_player_time", { clientId: playerId, seconds: 10 })
  }

  public endTurn() {
    this.socket.emit("end_turn");
  }

  public clearRoom(roomId: string) {

  }

  public on(event: string): Observable<any> {
    return new Observable((observer) => {
      this.socket.on(event, (data) => {
        observer.next(data)
      })

      // Handle cleanup
      return () => {
        this.socket.off(event)
      }
    })
  }

  public disconnect() {
    this.socket.disconnect() // Emite o evento `disconnect` para o servidor
  }
}
