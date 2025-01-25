export interface Player {
    id: string;
    name: string;
    timerId?: NodeJS.Timeout;
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

export enum NotificationType {
    dark = 1,
    danger = 2,
    success = 3
}

export interface Notification {
    title: string;
    message: string;
    type: NotificationType;
    time: number;
}
