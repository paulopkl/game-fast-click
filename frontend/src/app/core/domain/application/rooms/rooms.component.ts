import { CommonModule } from '@angular/common'
import { Component, OnInit } from '@angular/core'
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { Router, RouterModule } from '@angular/router'
import { SocketService } from '../../../../infrastructure/services/websocket/socket.service'
import { Room } from '../../models/game.interface'
import { HttpClient } from '@angular/common/http'
import { environment } from '../environments/environment'

@Component({
  selector: 'app-rooms',
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './rooms.component.html',
  styleUrl: './rooms.component.css'
})
export class RoomsComponent implements OnInit {
  form: FormGroup
  rooms: Room[] = []

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private http: HttpClient,
    private socketService: SocketService,
  ) {
    this.form = this.formBuilder.group({
      message: ''
    })
  }

  ngOnInit(): void {
    this.socketService.getRooms()

    this.socketService.on('rooms_list').subscribe((receivedRooms: Room[]) => {
      this.rooms = receivedRooms
    })
  }

  public joinRoom(roomId: string) {
    let userName = 'Player'

    this.socketService.joinRoom(roomId, userName)

    // Redireciona para a rota desejada
    this.router.navigate(['/room', roomId])
  }

  public clearRoom(roomId: string) {
    this.http.get(`${environment.API_URL}/game/clear-room/${roomId}`).subscribe({
      next: (response) => {
        console.log('Room cleared successfully', response);
      },
      error: (error) => {
        console.error('Error clearing the room', error);
      },
      complete: () => {
        console.log('Request completed.');
        // Any finalization logic could go here
      }
    });
  }
}
