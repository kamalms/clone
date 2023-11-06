import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { map } from 'rxjs';
// import { Customer } from './customer';
export interface Country {
  name?: string;
  code?: string;
}

export interface Representative {
  name?: string;
  image?: string;
}

export interface BNStrikeItem {
  created_at: string;
  id: number;
  exch: string | null;
  token: number;
  tsym: string;
  weekly: string;
  dname: string;
  optt: string;
  instname: string | null;
  cloneForm?: [] | any;
  totalNegativeSum?: number;
  totalPositiveSum?:number;
  show_to_trade: boolean
}

export interface Customer {
  id?: number;
  name?: number;
  country?: Country;
  company?: string;
  date?: string;
  status?: string;
  representative?: Representative;
}
@Injectable()
export class CustomerService {
  constructor(
    private http: HttpClient,
    private supabaseService: SupabaseService
  ) {}

  getCustomersLarge() {
    return this.http
      .get<any>('assets/test.json')
      .toPromise()
      .then((res) => <Customer[]>res.data)
      .then((data) => {
        return data;
      });
  }

  getSelectedStrikes() {
    return this.supabaseService.getStrikesFromDB();
  }

  getindexValues() {
    return this.http
      .get<any>('assets/data.json')
      .toPromise()
      .then((res) => <any[]>res.data)
      .then((data) => {
        return data;
      });
  }

  getindexValuesfromdata(token?:number) {
    if (token == 56711) {
      return this.http
      .get<any>('assets/pedata.json')
      .pipe(
        map((response) => {
          const modifiedResponse = {
            scriptData :response,
            scriptid: '12345',
          };
          return modifiedResponse;
        })
      );
    } else {
      return this.http
      .get<any>('assets/data.json')
      .pipe(
        map((response) => {
          const modifiedResponse = {
            scriptData :response,
            scriptid: '59190',
          };
          return modifiedResponse;
        })
      );
    }
    
  }

  get43800CEdata(token?:number) {
    if (token == 56654) {
      return this.http
      .get<any>('assets/43800_CE_oct_04.json')
      .pipe(
        map((response) => {
          const modifiedResponse = {
            scriptData :response,
            scriptid: '12345',
          };
          return modifiedResponse;
        })
      );
    } else {
      return this.http
      .get<any>('assets/data.json')
      .pipe(
        map((response) => {
          const modifiedResponse = {
            scriptData :response,
            scriptid: '59190',
          };
          return modifiedResponse;
        })
      );
    }
    
  }
}
