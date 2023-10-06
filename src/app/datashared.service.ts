import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DatasharedService {
  private strikeDetailSubject = new Subject<any>();
  strikeDetailasshared$ = this.strikeDetailSubject.asObservable();

  // Create two BehaviorSubjects to hold the values
  private B1Subject = new BehaviorSubject<any>({});
  private T1Subject = new BehaviorSubject<number>(0);

  // Create observables for the two values
  b1$ = this.B1Subject.asObservable();
  t1$ = this.T1Subject.asObservable();

  // Create a subject to hold the API responses with IDs
 apiResponsesSubject = new BehaviorSubject<{ id: number; data: any }[]>([]);
  constructor() {}

  // Update the authentication status
  updateStrikeDetailObservable(isAuthenticated: any) {
    this.strikeDetailSubject.next(isAuthenticated);
  }

  // Functions to update the values
  updateB1(newValue: any) {
    this.B1Subject.next(newValue);
  }

  updateT1(newValue: number) {
    this.T1Subject.next(newValue);
  }


}
