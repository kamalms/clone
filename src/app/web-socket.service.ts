import { Injectable } from '@angular/core';
import { Observable, Observer, Subject } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class WebSocketService{

  constructor() { }
  public subject!: Subject<MessageEvent>;

  public connect(url : any): Subject<MessageEvent> {
    if (!this.subject) {
      this.subject = this.create(url);
      console.log("Successfully connected: " + url);
    }
    return this.subject;
  }

  private create(url: any): Subject<MessageEvent> {
    let ws = new WebSocket(url);

    let observable = Observable.create((obs: Observer<MessageEvent>) => {
      ws.onmessage = obs.next.bind(obs);
      ws.onerror = obs.error.bind(obs);
      ws.onclose = obs.complete.bind(obs);
      return ws.close.bind(ws);
    });
    let observer = {
      next: (data: Object) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(data));
        }
      }
    };
    ws.onopen = () => {
      console.log('WebSocket connected');
      this.startHeartbeat(ws);
    };

    ws.onmessage = (event) => {
      console.log('Received message: ', event.data);
      // Add your message handling logic here
    };

    ws.onclose = (event) => {
      console.log('WebSocket disconnected');
    
      this.stopHeartbeat(); // Stop the heartbeat on disconnection
      this.close();
      // Try to reconnect after a short delay
      setTimeout(() => {
        this.connect("wss://piconnect.flattrade.in/PiConnectWSTp/");
      },10000); // Adjust the delay as needed
    };

    ws.onerror = (error) => {
      console.error('WebSocket error: ', error);
    };

    return Subject.create(observer, observable);
  }


  getDataFromWS(msg: any) {
    return this.subject.next(msg);
  }
  close() {
    this.subject.complete();
  }

  streamData () {

  }
  private heartbeatInterval: any;
  private startHeartbeat(ws : any): void {
    this.heartbeatInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send('heartbeat');
      }
    }, 5000); // Adjust the heartbeat interval as needed
  }
  
  private stopHeartbeat(): void {
    clearInterval(this.heartbeatInterval);
  }
}
