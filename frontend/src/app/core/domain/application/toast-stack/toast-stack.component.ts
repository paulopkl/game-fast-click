import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';

enum NotificationType {
  dark = 1,
  danger = 2,
  success = 3
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string | NotificationType;
  time: number;
}

@Component({
  selector: 'app-toast-stack',
  imports: [CommonModule],
  templateUrl: './toast-stack.component.html',
  styleUrl: './toast-stack.component.css',
  providers: [DatePipe]
})
export class ToastStackComponent {
  id: number = 0;
  toasts: Notification[] = [];

  addToast(toast: Notification) {
    let id = this.id++;

    this.toasts.push({
      ...toast,
      id,
      type: NotificationType[Number(toast.type)]
    });

    // Automatically remove the toast after 5 seconds
    setTimeout(() => {
      this.removeToast(id);
    }, 10000);
  }

  removeToast(id: number) {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
  }
}
