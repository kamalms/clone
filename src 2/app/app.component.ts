import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FlatTradeURLs } from './app.constants';
import { FlatTradeService } from './flattrade-service';
import { DepthDataService } from './depth-data.service';
import { FlatTradeWebSocketService } from './flat-trade.web-socket.service';
import { BnSRLevelComponent } from './bn-sr-level/bn-sr-level.component';
import { OpenPosition } from './models/openposition';
import { SupabaseService } from './supabase.service';
// var talib = require('../../node_modules/build/Release/talib');
const shajs = require('sha.js')
interface AutoCompleteCompleteEvent {
  originalEvent: Event;
  query: string;
}
// Renu@Miru1
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [
    FlatTradeWebSocketService,
    DepthDataService
  ]
})
export class AppComponent implements OnInit {

  // supabase
  session = this.supabase.session;

  @ViewChild(BnSRLevelComponent) bankniftylevels: any;
  //setting BN values Array
  BNValues!: any[];
  // selected Strike price Array
  strikeValues: any;
  // related to web socket

  title1 = 'socketrv';
  content = '';
  received: any = [];
  sent: any = [];

  // before
  items!: any[];

  selectedStrike: any;

  suggestions!: any[];

  buy1!: number;

  target1!: number ;

  SL: number = 2351.35;
  title = 'flattradeapiintegration';
  bankniftyTokenID: any;
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
  constructor(private readonly supabase: SupabaseService, private httpClient: HttpClient, public websocketconnection: FlatTradeWebSocketService,
    private flattradeService: FlatTradeService, public depthData: DepthDataService) {
    depthData.messages.subscribe((result: any) => {
      console.log('nfo check' , result)
      if (result) {
        if (result?.e == "NSE") {
          // BN values comes here
          console.log('BN values', result?.e);
          this.BNValues = result;
          this.checkBNsupport(result);
        } else if (result?.e == "NFO") {
          // strike price will come here

          this.strikeValues = result;
          this.setDynamicAlert(result)
        } else {
          // else as per syntax
        }
      }


    });
  }
  // search scrip
  search(event: AutoCompleteCompleteEvent) {
    let getToken = this.flattradeService.getUserObjectFromLocalStorage();
    let bodyOfuserDetails = {
    };
    const jKey = getToken?.token;
    bodyOfuserDetails = `jData={
        "uid":"${getToken?.client}",
      "stext":"${event?.query}"}&jKey=${jKey}`
    this.httpClient.post(FlatTradeURLs.SEARCHSCRIPS, bodyOfuserDetails).subscribe((scriptsResult: any) => {
      this.suggestions = scriptsResult.values;
    });
  }
  ngOnInit() {
    this.supabase.authChanges((_, session) => (this.session = session));
    this.getOpenPosition();
    // console.log("TALib Version: " + talib.version);
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
          // console.log('user response' , userResponse);
          this.getIndexList();
        })
      }
    });
    this.GetPendingGTTOrder();

  }

  // initial login flow related to get token
  getAuthFromFlatTradeApp() {
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromRequest = urlParams.get('code');

    // api key + requested code + api secret
    let combinationOfApikeyCodeSecretKey = FlatTradeURLs.APIKEY + codeFromRequest + FlatTradeURLs.SECRETKEY;
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
      "api_key": FlatTradeURLs.APIKEY,
      "request_code": codeFromRequest,
      "api_secret": hashvalue
    };
    this.httpClient.post<any>(FlatTradeURLs.GETTOKENURL,
      bodyobject).subscribe((tokenData) => {
        console.log('tokenData?.token', tokenData)
        if (tokenData?.token)
          this.flattradeService.setToken(tokenData)
      })
  }

  // PLACE ORDER API
  placeOrder() {

    let getToken = this.flattradeService.getUserObjectFromLocalStorage();
    let bodyOfplaceOrder = {
    };
    const jKey = getToken?.token;

    // tsym is unique name of strick
    // prc is order price it need to set my input box
    //trantype it is main Buy or Sell
    bodyOfplaceOrder = `jData={"uid":"${getToken?.client}",
      "actid":"${getToken?.client}",
      "exch":"NFO",
      "tsym":"${this.selectedStrike?.tsym}",
      "qty":"15",
      "prc":"${this.buy1}",
      "prd":"M",
      "trantype":"B",
      "prctyp":"LMT",
      "ret":"DAY"
    }
   &jKey=${jKey}`;
    this.httpClient.post(FlatTradeURLs.PLACEORDER, bodyOfplaceOrder).subscribe((scriptsResult: any) => {
      console.log('place order', scriptsResult);
      if (scriptsResult?.norenordno) {

      }
    });
  }

  // get data from chart
  // this also gives specific strick data
  // but response time long compare to websocket

  getStrikeDataByChart() {
    let currenttime = new Date().toLocaleString();
    let getToken = this.flattradeService.getUserObjectFromLocalStorage();
    let bodyOfplaceOrder = {
    };
    bodyOfplaceOrder = `jData={"uid":"${getToken?.client}","exch":"NFO",
    "token":"${this.selectedStrike?.token}",
    "st":"${currenttime}",
    "intrv":"15"}&jKey=${getToken?.token}`;
    this.httpClient.post(FlatTradeURLs.TIMEPRICESeries, bodyOfplaceOrder).subscribe((scriptsResult: any) => {
      console.log('getTimePriceData', scriptsResult);
      this.VWAPAlgo(scriptsResult)
    });
  }
  // get strike data by chart
  getBNvalueByChart() {
    let currenttime = new Date().toLocaleString();
    let getToken = this.flattradeService.getUserObjectFromLocalStorage();
    let bodyOfplaceOrder = {
    };
    bodyOfplaceOrder = `jData={"uid":"${getToken?.client}","exch":"NSE",
    "token":"${this.bankniftyTokenID}",
    "st":"${currenttime}",
    "intrv":"15"}&jKey=${getToken?.token}`;
    this.httpClient.post(FlatTradeURLs.TIMEPRICESeries, bodyOfplaceOrder).subscribe((scriptsResult: any) => {
      console.log('getBNvalueByChart 3', scriptsResult)
    });
    console.log(JSON.parse(localStorage.getItem('supportandresistance') || '{}'))
  }

  // get nifty nifty bank list and it toke name
  private message = {
    "t": "c",
    "uid": "FT009181",
    "actid": "FT009181",
    "source": "API",
    "susertoken": ""
  }
  getIndexList() {
    let getToken = this.flattradeService.getUserObjectFromLocalStorage();
    let bodyOfplaceOrder = {
    };
    bodyOfplaceOrder = `jData={"uid":"${getToken?.client}","exch":"NSE"}&jKey=${getToken?.token}`;
    // set web socket object
    this.message = {
      "t": "c",
      "uid": "FT009181",
      "actid": "FT009181",
      "source": "API",
      "susertoken": `${getToken?.token}`
    }

    this.httpClient.post(FlatTradeURLs.GETINDEXLIST, bodyOfplaceOrder).subscribe((scriptsResult: any) => {
      // console.log('getIndexList' , scriptsResult);
      if (scriptsResult?.values) {
        // Nifty Bank
        let obj = scriptsResult?.values?.find((o: any) => o.idxname === 'Nifty Bank');
        console.log(obj);
        this.bankniftyTokenID = obj?.token;
        if (this.bankniftyTokenID) {
          let currenttime = new Date().toLocaleString();
          let getToken = this.flattradeService.getUserObjectFromLocalStorage();
          let bodyOfplaceOrder = {
          };
          bodyOfplaceOrder = `jData={"uid":"${getToken?.client}","exch":"NFO",
    "token":"${this.bankniftyTokenID}",
    "st":"${currenttime}",
    "intrv":"5"}&jKey=${getToken?.token}`;
          this.httpClient.post(FlatTradeURLs.TIMEPRICESeries, bodyOfplaceOrder).subscribe((scriptsResult: any) => {
            // console.log('bank nifty values' , scriptsResult)
            this.sendMsg();
            this.getBNValues();
          });
        }
      }
    });
  }
  // related to websocket workaround
  sendMsg() {
    console.log("new message from client to websocket: ", this.message);
    this.depthData.messages.next(this.message);
    this.getBankNiftySpecificStrickeRate();
  }


  // get strike rate by web socket depth subcribe
  getBankNiftySpecificStrickeRate() {
    let strickobject = {
      "t": "d",
      "k": `NFO|${this.selectedStrike?.token}`
    };
    this.websocketconnection.getDataFromWS(strickobject);
  }
  setStrikeandValues() {
    // disable buying zone and target values
    // so far
    let buyandsell = {
      buy1 : this.buy1,
      t1 :this.target1,
      sl:this.SL
    }
    localStorage.setItem('buyandsellvalues', JSON.stringify(buyandsell));
    this.setDynamicAlert();
    this.getPendingAlert();
  }

  // get BN index values from sockets
  getBNValues() {
    let BNObject = {
      "t": "d",
      "k": `NSE|${this.bankniftyTokenID}`
    }
    this.websocketconnection.getDataFromWS(BNObject);
  }

  displayVAlues() {
    console.log(this.BNValues)
    console.log(this.strikeValues)
  }

  // GTT ORDER List


  getOpenGTTList() {
    let getToken = this.flattradeService.getUserObjectFromLocalStorage();
    let Gtt = {
    };
    Gtt = `jData={"uid":"${getToken?.client}"}&jKey=${getToken?.token}`;
    this.httpClient.post(FlatTradeURLs.GETENABLEDGTTORDERLIST, Gtt).subscribe((gttList: any) => {
      console.log('gttList', gttList);
    });
  }
  GetPendingGTTOrder() {
    let getToken = this.flattradeService.getUserObjectFromLocalStorage();
    let GetPendingGTTOrder = {
    };
    GetPendingGTTOrder = `jData={"uid":"${getToken?.client}"}&jKey=${getToken?.token}`;
    this.httpClient.post(FlatTradeURLs.GetPendingGTTOrder, GetPendingGTTOrder).subscribe((GetPendingGTTOrder: any) => {
      // console.log('GetPendingGTTOrder' , GetPendingGTTOrder);
    });
  }

  ngAfterViewInit() {
    console.log(this.bankniftylevels)
    this.multipleSr();
  }

  // write logic for support level reach condition
  // so take values from S & R component

  // current trading values is important it should be from web socket or by chart api

  checkBNsupport(currentBNvalues?: any) {
   // console.log('current vlaues', currentBNvalues);
    let bankniftyWSResponseObject = {
      lasttradedPrice: currentBNvalues?.lp,
      openPrice: currentBNvalues?.o,
      closePrice: currentBNvalues?.c,
      highPrice: currentBNvalues?.h,
      lowPrice: currentBNvalues?.l,
      averageTradePrice: currentBNvalues?.ap,

    }
    // console.log('formatted values', bankniftyWSResponseObject?.lasttradedPrice)
    // console.log('type of check', this.bankniftylevels.s1);

    // bank nifty support 1 reaches trigger alert

    // s1 = 44150
    // if (this.bankniftylevels?.s1.toString() > bankniftyWSResponseObject?.lasttradedPrice) {
    //   console.log('trading below S1 level')
    // }

    // // s2 44000
    // if (this.bankniftylevels?.s2.toString() > bankniftyWSResponseObject?.lasttradedPrice) {
    //   console.log('trading below S2 level')
    // }
    // // s3 43900
    // if (this.bankniftylevels?.s3.toString() > bankniftyWSResponseObject?.lasttradedPrice) {
    //   console.log('trading below S3 level')
    // }

    //  r1 44350
    //  r2 44450
    //  r3 44600
    // if (this.bankniftylevels.r1.toString() < bankniftyWSResponseObject?.lasttradedPrice) {
    //   console.log('trading above r1 and try to break Resistance 2 ')
    // }

    // if (this.bankniftylevels.r2.toString() < bankniftyWSResponseObject?.lasttradedPrice) {
    //   console.log('r2 above')
    // }

    // if (this.bankniftylevels.r3.toString() < bankniftyWSResponseObject?.lasttradedPrice) {
    //   console.log('r3 above ')
    // }




    // bank nifty reach resistance buy PE but  how to choose pe strike
    // that logic is another flow
    // first make sure metioned price  levels , buying and put SL and target automatically is first achievement for this MVP

    // now aug 28 time 11.53 resistance came @ 44450 before

    // how will handle this one befoe mentioned resistance (44450 expxected)
    // look like take resistance  from 44,440 reversed
    // now will take PE once again comes t
  }

  VWAPAlgo(arrayofvalues: any) {
    console.log('arrayofvalues', arrayofvalues);
    this.supportandResistanceBreakout();
    // Simulated historical price and volume data
    // const time = Array.from({ length: 100 }, (_, i) => i + 1);
    // const price = Array.from({ length: 100 }, () => Math.random() * (150 - 50) + 50);
    // const volume = Array.from({ length: 100 }, () => Math.floor(Math.random() * (5000 - 1000)) + 1000);
    // arrayofvalues.map((vwap) => {
    //   if (vwap?.time) {

    //   }
    // })
    // time
    // intc
    // v
    let timearray: any = [];

    let pricearray: any = [];
    let volumearray: any = [];
    arrayofvalues.map((e: any) => {
      timearray.push(e?.time);
      pricearray.push(e?.intc);
      volumearray.push(e?.v);


    })
    const time = timearray;
    console.log('time', time)
    const price = pricearray;
    const volume = volumearray;
    console.log(time, price, volume)
    // Calculate VWAP
    const vwap = [];
    let cumulativePriceVolume = 0;
    let cumulativeVolume = 0;

    for (let i = 0; i < time.length; i++) {
      cumulativePriceVolume += price[i] * volume[i];
      cumulativeVolume += volume[i];
      vwap.push(cumulativePriceVolume / cumulativeVolume);
    }
    console.log('vwap', vwap)
    // Simulated current market price
    const currentPrice = arrayofvalues[0]?.intc;

    // Check trading signal
    if (currentPrice > vwap[vwap.length - 1]) {
      console.log("Consider bullish trading opportunities.");
    } else if (currentPrice < vwap[vwap.length - 1]) {
      console.log("Consider bearish trading opportunities.");
    } else {
      console.log("Current price is around VWAP. No specific trading signal.");
    }

  }

  supportandResistanceBreakout() {
    // Simulated historical price data
    const historicalPrices = [100, 105, 110, 108, 112, 115, 120, 118, 125, 130, 135, 140, 138, 145, 150];

    // Define support and resistance levels
    const supportLevel = this.bankniftylevels.s1;
    const resistanceLevel = this.bankniftylevels.r2;

    // Simulated current market price
    const currentPrice = 44500;

    // Check for breakout signals
    if (currentPrice > resistanceLevel) {
      console.log("Resistance breakout detected. Consider entering a long position.");
    } else if (currentPrice < supportLevel) {
      console.log("Support breakout detected. Consider entering a short position.");
    } else {
      console.log("No breakout signal detected.");
    }

  }

  multipleSr() {

    // Simulated historical price data
    const historicalPrices = [100, 105, 110, 108, 112, 115, 120, 118, 125, 130, 135, 140, 138, 145, 150];

    // Define arrays of support and resistance levels
    const supportLevels = [this.bankniftylevels.s1, this.bankniftylevels.s2, this.bankniftylevels.s3];
    const resistanceLevels = [this.bankniftylevels.r1, this.bankniftylevels.r2, this.bankniftylevels.r3];

    // Simulated current market price
    const currentPrice = 44500;

    // Check for breakout signals
    let breakoutDetected = false;

    for (const resistanceLevel of resistanceLevels) {
      if (currentPrice > resistanceLevel) {
        console.log(`Resistance breakout detected at ${resistanceLevel}. Consider entering a long position.`);
        breakoutDetected = true;
        break; // Exit the loop if breakout detected
      }
    }

    if (!breakoutDetected) {
      for (const supportLevel of supportLevels) {
        if (currentPrice < supportLevel) {
          console.log(`Support breakout detected at ${supportLevel}. Consider entering a short position.`);
          break; // No need to continue checking support levels
        }
      }
    }

    if (!breakoutDetected) {
      console.log("No breakout signal detected.");
    }

  }

  // Set alert in flat trade
  // so it will be dynamic , we will place based on alert trigger manalully also

  setDynamicAlert(currentStrikeValue? : any) {
    console.log('here buy and sell values' , JSON.parse(localStorage.getItem('buyandsellvalues') || '{}'))
    // how you are going to dynamically set alert
    // yes instead of calling place order api , we call , set alert
    // we do this directly to strike level
    // get values from input Buy 1 , SL Target /

    // if b1 triggered , set alert ,
    // what is different instead of this you can directly use mobile app and set this price range ?
    // i am right ? yes right thinking about it
    // what works it covers is , i instead of manual enter it will do via api

    // what will happen if   trigger place order //
    // we  don't know it is taking support or goes below it
    // yes some time it won't respect minor support will go to main support
    // we need to define main support and minor support
    // normal market respect minor support
    // volite market or expiry day it won't respect the support and resistance also
    // maye be pure downtrend mean , buying at mentioned point also make loss
    //so placing order dynamically is require more confirmation
    // like 1 ) overall trend is bullish or bearsih
    // 2 ) support hit
    // 3 ) retracement taken
    // 4) check open interest of main index

      // get values from input Buy 1 , SL Target /

    // if b1 triggered , set alert ,
    let strikeRateResponse = {
      lasttradedPrice: currentStrikeValue?.lp,
      openPrice: currentStrikeValue?.o,
      closePrice: currentStrikeValue?.c,
      highPrice: currentStrikeValue?.h,
      lowPrice: currentStrikeValue?.l,
      averageTradePrice: currentStrikeValue?.ap,

    }
    console.log('log every sec', strikeRateResponse?.lasttradedPrice)
    // check async every second
    // logic is price came below buy 1 price
    let getToken = this.flattradeService.getUserObjectFromLocalStorage();

    if (strikeRateResponse?.lasttradedPrice + 5  < this.buy1) {
      // below mentioned price so trigger alert or buy
      let SetAlert = {
      };
      SetAlert = `jData={
        "uid":"${getToken?.client}",
        "tsym":"${this.selectedStrike?.tsym}",
        "exch":"NFO",
        "ai_t":"LTP_B",
        "validity":"GTT",
        "d":"${this.buy1}",
        "remarks":"${this.selectedStrike?.dname} is triggered for buy "
      }
     &jKey=${getToken?.token}`;
      this.httpClient.post(FlatTradeURLs.SetAlert, SetAlert).subscribe((SetAlert: any) => {
         console.log('buy Trigger alert' , SetAlert);
         if (SetAlert?.al_id) {
          this.placeOrder()
         }
      });
    } else if (strikeRateResponse?.lasttradedPrice >  this.target1) {
      let TargetPriceAlert = {
      };
      TargetPriceAlert = `jData={
        "uid":"${getToken?.client}",
        "tsym":"${this.selectedStrike?.tsym}",
        "exch":"NFO",
        "ai_t":"LTP_B",
        "validity":"GTT",
        "d":"${this.target1}",
        "remarks":"${this.selectedStrike?.dname} is triggered for buy "
      }
     &jKey=${getToken?.token}`;
     this.httpClient.post(FlatTradeURLs.SetAlert, TargetPriceAlert).subscribe((TargetPriceAlert: any) => {
      console.log(' Trigger alert' , TargetPriceAlert);
      if (TargetPriceAlert?.al_id) {

      }
   });
    }
  }

  // get all alert set by api
  getPendingAlert() {
    let getToken = this.flattradeService.getUserObjectFromLocalStorage();
      let GetPendingAlert = {
      };
      GetPendingAlert = `jData={"uid":"FT009181"}&jKey=${getToken?.token}`;
      this.httpClient.post(FlatTradeURLs.GetPendingAlert,GetPendingAlert).subscribe((GetPendingAlert: any) => {
         console.log('GetPendingAlert' , GetPendingAlert);
      });
  }

  getOpenPosition() {
    let getToken = this.flattradeService.getUserObjectFromLocalStorage();
    let PositionBook = {
    };
    PositionBook = `jData={"uid":"FT009181","actid":"FT009181"}&jKey=${getToken?.token}`;
    return this.httpClient.post(FlatTradeURLs.PositionBook,PositionBook).subscribe(
      ( PositionBook : any ) => {
       console.log('PositionBook' , PositionBook);
    });
  }

  PlaceOCOOrder() {

    let getToken = this.flattradeService.getUserObjectFromLocalStorage();
    let bodyOfplaceOrder = {
    };
    const jKey = getToken?.token;

    // tsym is unique name of strick
    // prc is order price it need to set my input box
    //trantype it is main Buy or Sell
// reference
//     "place_order_params" = {"tsym":"ACC-EQ",
// "exch":"NSE","trantype":"B","prctyp":"MKT","prd":"C",
// "ret":"DAY","actid":"ASHWATHINV","uid":"ASHWATHINV", "ordersource":"WEB","qty":"1",
// "prc":"0"},


// jData={"uid":"FT009181",
// "ai_t":"LMT_BOS_O",
// "remarks":"target%20value",
// "validity":"GTT",
// "tsym":"BANKNIFTY31AUG23C44600",
// "exch":"NFO",
// "oivariable":[{"d":"175","var_name":"x"},{"d":"70", "var_name":"y"}],
// "place_order_params":
// {"tsym":"BANKNIFTY31AUG23C44600",
// "exch":"NFO","trantype":"S","prctyp":"LMT","prd":"M", "ret":"DAY","actid":"FT009181","uid":"FT009181", "ordersource":"WEB","qty":"45", "prc":"117.05"},
// "place_order_params_leg2":{"tsym":"BANKNIFTY31AUG23C44600", "exch":"NFO", "trantype":"S", "prctyp":"LMT","prd":"M", "ret":"DAY","actid":"FT009181","uid":"FT009181", "ordersource":"WEB","qty":"45", "prc":"117.05"}}
// &jKey=745d7318f8f4318b800279597757811175f1c8c822cda986ea8dcf4e5e5c8006

let place_order_params = `{
       "uid":"${getToken?.client}",
      "actid":"${getToken?.client}",
      "exch":"NFO",
      "tsym":"${this.selectedStrike?.tsym}",
      "qty":"15",
      "prc":"${this.buy1}",
      "prd":"M",
      "trantype":"B",
      "prctyp":"LMT",
      "ret":"DAY",
      "ordersource":"WEB"
    }`;

    bodyOfplaceOrder = `jData={"uid":"${getToken?.client}",
    "tsym":"${this.selectedStrike?.tsym}",
    "exch":"NFO",
    "validity":"GTT",
    "ai_t":"LMT_BOS_O",
    "place_order_params":
    }
   &jKey=${jKey}`;


    this.httpClient.post(FlatTradeURLs.PlaceOCOOrder, bodyOfplaceOrder).subscribe((PlaceOCOOrder: any) => {
      console.log('Place OCO Order', PlaceOCOOrder)
    });
  }
}

