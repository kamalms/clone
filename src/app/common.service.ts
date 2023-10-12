import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CommonService {
  emptyobject = {
    empty: 'empty',
  };
  private token = new BehaviorSubject('empty');
  getToken = this.token.asObservable();
  constructor() {
    if (this.getUserObjectFromLocalStorage()) {
      this.token.next(this.getUserObjectFromLocalStorage());
    }
  }
  setToken(responseToken: any) {
    this.token.next(responseToken);
    localStorage.clear();
    localStorage.setItem('userObj', JSON.stringify(responseToken));
  }

  getUserObjectFromLocalStorage() {
    //   return data;
    return JSON.parse(localStorage.getItem('userObj') || '{}');
  }

  setrunningAlgos(currentAlgos : any) {
    localStorage.setItem('runningAlogs', JSON.stringify(currentAlgos));
  }
  getRunningAlgos() {
    return JSON.parse(localStorage.getItem('runningAlogs') || '{}');
  }
}
