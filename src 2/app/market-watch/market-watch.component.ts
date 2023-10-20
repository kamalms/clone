import { Component, Input, OnInit } from '@angular/core';
import { SupabaseService } from '../supabase.service';
import { AuthSession } from '@supabase/supabase-js';
// ES6 import
// import tradingView from '@mathieuc/tradingview';
// const tradingView = require('@mathieuc/tradingview');
@Component({
  selector: 'app-market-watch',
  templateUrl: './market-watch.component.html',
  styleUrls: ['./market-watch.component.scss']
})
export class MarketWatchComponent implements OnInit {
  @Input()
  session!: AuthSession;
  constructor(private readonly supabase: SupabaseService) {

  }
  ngOnInit() {
    this.getMarketWatchlist();
    // Example usage
// const data = tradingView.getData();
//     console.log('traing view data', data)
  }

  async getMarketWatchlist() {
//     select: username,website,avatar_url
// id: eq.c619c32f-c873-4d8f-ba0b-2d49f15a9636
    try {
      const { user } = this.session;
      let { data: profile, error, status } = await this.supabase.getWatchList(user);
      let { data: profile12 } = await this.supabase.profile(user);
      if (error && status !== 406) {
        throw error;
      }
      console.log('profile in new mareket watch compoent', profile)
      if (profile) {
       // this.profile = profile;
      }
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
    } finally {
      //this.loading = false;
    }
  }
}
