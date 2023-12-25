import { Component, OnInit, ViewChild } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { CommonService } from './common.service';
import { FlatTradeURLs } from './app.constants';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { MatTabGroup } from '@angular/material/tabs';
const shajs = require('sha.js')
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  @ViewChild(MatTabGroup) tabGroup!: MatTabGroup;
  title = 'angular-user-management';

  session = this.supabase.session;
  token! : string;

  // Appname in wall flattrade app
  // APIKEY = "01467ab8d37b4c5ba71f41eb6df9965d";
  // SECRETKEY = "2023.160431adadd34faf85fafa4af90d507935b003d29d382d27";
  // Renu@Miru1
  // steps to do

  // on start application  send request  to
  // https://auth.flattrade.in/?app_key=APIKEY (52a449a96dbf433bb0ff432c370c8a33)

  // it will take to auth page of flat trade
  // get token from that page and close

  // using that token create new request to hit another api

  // that api response token it will be used to throughout the application

  // First point of the application start

  // now start of applicationn should be from flattrade auth page it redirect to our appllication
  // so 4200 will get the token value

  // step 2

  // now using this token create sh
  constructor(private readonly supabase: SupabaseService,private httpClient: HttpClient,
    private flattradeService: CommonService
    ) {}

    servetoken() {
      let getToken = this.flattradeService.getUserObjectFromLocalStorage();
      let tokenData = {
        "token" : `${this.token}`,
        "client":"FT032747",
        "stat":"ok",
        "ems":""
      };
    this.flattradeService.setToken(tokenData);
    }
  ngOnInit() {
  //  this.supabase.signup();
    this.supabase.authChanges((_, session) => (this.session = session));
    
   this.getAuthFromFlatTradeApp();
   this.flattradeService.getToken.subscribe((tokenFromService: any) => {
    let getToken = this.flattradeService.getUserObjectFromLocalStorage();
    if (tokenFromService != 'empty') {
      console.log('not empty')
      // call user details api for furture api request
      let bodyOfuserDetails = {
      };
      const jKey = getToken?.token;
      bodyOfuserDetails = `jData={"uid":"${getToken?.client}"}&jKey=${jKey}`;
      this.httpClient.post(FlatTradeURLs.USERDETAILS, bodyOfuserDetails).subscribe((userResponse) => {
        console.log('user response' , userResponse);

      })
    }
  });
  }

  // initial login flow related to get token
  getAuthFromFlatTradeApp() {
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromRequest = urlParams.get('code');

    // api key + requested code + api secret
    let combinationOfApikeyCodeSecretKey = environment.APIKEY + codeFromRequest + environment.SECRETKEY;
   // console.log('combinationOfApikeyCodeSecretKey', combinationOfApikeyCodeSecretKey);

    let hashvalue;
    if (combinationOfApikeyCodeSecretKey) {
      hashvalue = shajs('sha256').update(combinationOfApikeyCodeSecretKey).digest('hex');
    }
    if (codeFromRequest && hashvalue)
      this.getApiToken(codeFromRequest, hashvalue)
  }

  // step 3 now we have sha 256 value somehow based on snippet
  // not why value lenght are diffrent don't know
  // after verified with online sha 256 value length is different
  // so , used sha .j s package it is correct value match

  // now will have token ,
  // call second api to get final token, which is used to trigger all other api's

  getApiToken(codeFromRequest: string, hashvalue: string) {
    let bodyobject = {
      "api_key": environment.APIKEY,
      "request_code": codeFromRequest,
      "api_secret": hashvalue
    };
    this.httpClient.post<any>(environment.GETTOKENURL,
      bodyobject).subscribe((tokenData) => {
        console.log('tokenData?.token', tokenData)
        if (tokenData?.token)
          this.flattradeService.setToken(tokenData)
      })
  }
  ngAfterViewInit() {
    // Set the index of the tab you want to navigate to (index starts from 0)
    const tabIndexToNavigate = 0; // for example, navigating to the third tab
    this.tabGroup.selectedIndex = tabIndexToNavigate;
  }
}

// if (typeof Worker !== 'undefined') {
//   console.log('in app ts file')
//   // Create a new
//   const worker = new Worker(new URL('./app.worker', import.meta.url));
//   worker.onmessage = ({ data }) => {
//     console.log(`page got message: ${data}`);
//   };
//   worker.postMessage('hello');
//   worker.postMessage('start');
// } else {
//   console.log('not support on this env')
//   // Web Workers are not supported in this environment.
//   // You should add a fallback so that your program still executes correctly.
// }