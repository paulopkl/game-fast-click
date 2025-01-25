export interface Player {
  id: string;
  name: string;
  timeLeft: number;
  timeToLose: number;
  isPlaying: boolean;
  alreadyActed: boolean;
}

export interface Room {
  id: string;
  name: string;
  playerTurn: number;
  gameStarted: boolean;
  gameFinished: boolean;
  players: Player[];
}
