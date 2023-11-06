import { Injectable } from '@angular/core';
import {
  AuthChangeEvent,
  AuthSession,
  createClient,
  Session,
  SupabaseClient,
  User,
} from '@supabase/supabase-js';
import { environment } from 'src/environments/environment';
import { Database } from 'src/schema';

export interface Profile {
  id?: string;
  username: string;
  website: string;
  avatar_url: string;
}

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient<any>;
  _session: AuthSession | null = null;

  constructor() {
    this.supabase = createClient<Database>(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  get session() {
    this.supabase.auth.getSession().then(({ data }) => {
      this._session = data.session;
    });
    return this._session;
  }

  profile(user: User) {
    return this.supabase
      .from('profiles')
      .select(`username, website, avatar_url`)
      .eq('id', '5aba801e-70f9-4211-b299-b60dd1571d92')
      .single();
  }

  gethello() {
    return this.supabase.from('hello').select('*').eq('id', '1');
  }

  getStrikesFromDB() {
    return this.supabase.from('market_watch').select('*');
  }

  signup() {
    return this.supabase.auth.signUp({
      email: 'admin@123.com',
      password: 'admin123',
    });
  }
  login(user: any) {
    return this.supabase.auth.signInWithPassword({
      email: 'testuser@gmail.com',
      password: 'admin',
    });
  }
  authChanges(
    callback: (event: AuthChangeEvent, session: Session | null) => void
  ) {
    return this.supabase.auth.onAuthStateChange(callback);
  }

  signIn(email: string) {
    return this.supabase.auth.signInWithOtp({ email });
  }

  signOut() {
    return this.supabase.auth.signOut();
  }

  updateProfile(profile: Profile) {
    const update = {
      ...profile,
      updated_at: new Date(),
    };

    return this.supabase.from('profiles').upsert(update);
  }

  downLoadImage(path: string) {
    return this.supabase.storage.from('avatars').download(path);
  }

  uploadAvatar(filePath: string, file: File) {
    return this.supabase.storage.from('avatars').upload(filePath, file);
  }

  // init of epic

  async insertMarketWatch(dataFromSource: any) {
    return this.supabase
      .from('market_watch')
      .upsert([
        {
          dname: dataFromSource?.dname,
          tsym: dataFromSource?.tsym,
          weekly: dataFromSource?.weekly,
          optt: dataFromSource?.optt,
          token: dataFromSource?.token,
          show_to_trade:true
        },
      ])
      .select();
  }
  async updateToMarketWatch(dataFromForm: any): Promise<any> {
    if (dataFromForm) {
      return (
        this.supabase
          .from('market_watch')
          .update([
            {
              show_to_trade: dataFromForm?.show_to_trade
            },
          ])
          .eq('id', dataFromForm?.id)
          .select()
      );
    }
  }

  async deleteMarketWatch(dataFromSource: any) {
    return this.supabase
      .from('market_watch')
      .delete()
      .eq('id', dataFromSource?.id)
      .eq('token', dataFromSource?.token)
      .select();
  }

  // get values using token
  async getPriceValuesFromPriceTable(token: string) {
    return this.supabase.from('strike_prices').select('*').eq('token', token);
  }

  // get values using unique id
  async getPriceValuesFromPriceTableByID(id: string) {
    return this.supabase.from('strike_prices').select('*').eq('id', id);
  }

  async getActivatedStrategyFromTable() {
    return this.supabase.from('strike_prices').select('*').eq('s_running_status', true);
  }
  async insertToStrikePrice(dataFromForm: any, startandenddate: any) {
    return this.supabase
      .from('strike_prices')
      .upsert([
        {
          token: dataFromForm?.token,
          notes: dataFromForm?.notes,
          B1: dataFromForm?.B1,
          T1: dataFromForm?.T1,
          SL: dataFromForm?.SL,
          start_date: startandenddate?.start_date,
          end_date: startandenddate?.end_date,
          buytriggered:dataFromForm?.buytriggered,
          dname:dataFromForm?.dname,
          tsym:dataFromForm?.tsym
        },
      ])
      .select();
  }
  async updateToStrikePrice(
    dataFromForm: any,
    startandenddate?: any
  ): Promise<any> {
    if (dataFromForm) {
      console.log('update strike price' , dataFromForm?.token)
      // const filterCondition = {
      //   // You can specify the condition based on your requirements
      //   // For example, to update rows where 'id' is greater than 10:
      //   token: { eq: '50148' },
      // };
      return (
        this.supabase
          .from('strike_prices')
          .update([
            {
              notes: dataFromForm?.notes,
              B1: dataFromForm?.B1,
              T1: dataFromForm?.T1,
              SL: dataFromForm?.SL,
              start_date: startandenddate?.start_date,
              end_date: startandenddate?.end_date,
              buytriggered:dataFromForm?.buytriggered,
              selltriggered:dataFromForm?.selltriggered,
              sltriggered:dataFromForm?.sltriggered,
              s_running_status:dataFromForm?.s_running_status  

            },
          ])
          .eq('id', dataFromForm?.token)
          // .eq('token', dataFromForm?.token)
          //.match(filterCondition)
         // .select()
      );
    }
  }

  async deleteStrikePrice(dataFromSource: any) {
    return this.supabase
      .from('strike_prices')
      .delete()
      .eq('id', dataFromSource?.id)
      .select();
  }

  //back  testing table interactions

  async getPriceValuesFromBacktesting(strategy_id: string | number) {
    return this.supabase
      .from('backtesting')
      .select('*')
      .eq('strategy_id', strategy_id)
      .order('created_at', { ascending: true });
  }
  async insertToBacktesting(dataFromForm: any) {
    return this.supabase
      .from('backtesting')
      .upsert([
        {
          token: dataFromForm?.token,
          B1: dataFromForm?.B1,
          order_type: dataFromForm?.order_type,
          time_happened: dataFromForm?.time_happened,
          strategy_id: dataFromForm?.strategy_id,
          sl_trigger: dataFromForm?.sl_trigger
        },
      ])
      .select();
  }
  async updateToBacktesting(dataFromForm: any): Promise<any> {
    if (dataFromForm) {
      const filterCondition = {
        // You can specify the condition based on your requirements
        // For example, to update rows where 'id' is greater than 10:
        token: { eq: '50148' },
      };
      return (
        this.supabase
          .from('backtesting')
          .update([
            {
              token: dataFromForm?.token,
              B1: dataFromForm?.B1,
              order_type: dataFromForm?.order_type,
            },
          ])
          .eq('token', dataFromForm?.token)
          //.match(filterCondition)
          .select()
      );
    }
  }

  async insertVerificationData(
    dataFromForm: any
  ): Promise<any> {
    if (dataFromForm) {
      return (
        this.supabase
          .from('strike_prices')
          .update([
            {
              verified: dataFromForm?.verified 

            },
          ])
          .eq('id', dataFromForm?.order_id)
          .select()
      );
    }
  }
}
