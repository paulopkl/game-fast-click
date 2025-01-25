import { Routes } from '@angular/router'
import { GameComponent } from './core/domain/application/game/game.component'
import { AppComponent } from './app.component'
import { RoomsComponent } from './core/domain/application/rooms/rooms.component'

export const routes: Routes = [
  // { path: '', redirectTo: '/home', pathMatch: 'full' }, // Default route
  { path: '', component: RoomsComponent }, // Default route
  { path: 'room/:roomId', component: GameComponent, pathMatch: 'full' }, // Game route
  { path: '**', redirectTo: '/' } // Fallback for unmatched routes
]
