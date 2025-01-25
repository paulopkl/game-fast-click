import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'

@Injectable({
  providedIn: 'root'
})
export class GameService {
  constructor(private http: HttpClient) {}

  create(data: any) {
    return this.http.post('http://localhost:3000/api/message', data)
  }
}
