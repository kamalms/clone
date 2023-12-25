import { Injectable } from '@angular/core';
import { Subject, map } from 'rxjs';
import { WebSocketService } from './web-socket.service';
const CHAT_URL = "wss://piconnect.flattrade.in/PiConnectWSTp/";
// const CHAT_URL = "ws://localhost:40510";
export interface Message {
  author: string;
  message: string;
}
export interface wsInit {
  t: string;
  uid:string;
  actid:string;
  source:string;
  susertoken:string;
}
export interface getBNStrikeRate {
    t : string;
    k:string;
}
@Injectable({
  providedIn: 'root'
})
export class DepthDataService {

  public messages: Subject<wsInit | getBNStrikeRate>;
  constructor(wsService: WebSocketService) {
    this.messages = <Subject<wsInit | getBNStrikeRate>>wsService.connect(CHAT_URL)
    .pipe(
    map(
      (response: MessageEvent): any => {
        let data = JSON.parse(response.data);
        return data;
      }
    )
    );
  }
}
