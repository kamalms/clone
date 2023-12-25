import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { PrimeNGConfig, SelectItemGroup } from "primeng/api";
import { DepthDataService } from '../depth-data.service';
import { WebSocketService } from '../web-socket.service';
interface City {
  name: string;
  code: string;
}

interface Country {
  name: string;
  code: string;
}

@Component({
  selector: 'app-scalping',
  templateUrl: './scalping.component.html',
  styleUrls: ['./scalping.component.css']
})
export class ScalpingComponent implements OnInit {

 
  cities: City[];

  countries: any[];

  selectedCity!: City;

  selectedCountries!: any[];

  groupedCities: SelectItemGroup[];

  // custom logic required
  // maxOpenPosition : number  = 0; 
  // slicingQty : number = 0; 
  // averagePrice : number = 0 ;
  // exitPrice : number = 0 ;
  // startPrice : number = 0 ;
  
  form: FormGroup;
  // it is BN or Nifty or Fin nifty
  productType! : string ;
  noOfExectutionToHappen! : number[];
  // Array to maintain buy orders
  buyOrders : any = [];
  constructor(private primengConfig: PrimeNGConfig , private fb: FormBuilder, public depthData: DepthDataService,
    public websocketconnection: WebSocketService) {
    this.form = this.fb.group({
      maxOpenPosition: [30, [Validators.required,this.checkMentionedQtyAreCorrectLotForMaxOpenPosition()]],
      slicingQty: [5, [Validators.required, this.checkMentionedQtyAreCorrectLot()]],
      averagePrice: [5, [Validators.required,]],
      exitPrice: [10, [Validators.required]],
      startPrice: [100, [Validators.required]],
    });
    this.cities = [
      { name: "New York", code: "NY" },
      { name: "Rome", code: "RM" },
      { name: "London", code: "LDN" },
      { name: "Istanbul", code: "IST" },
      { name: "Paris", code: "PRS" }
    ];

    this.countries = [
      { name: "Australia", code: "AU" },
      { name: "Brazil", code: "BR" },
      { name: "China", code: "CN" },
      { name: "Egypt", code: "EG" },
      { name: "France", code: "FR" },
      { name: "Germany", code: "DE" },
      { name: "India", code: "IN" },
      { name: "Japan", code: "JP" },
      { name: "Spain", code: "ES" },
      { name: "United States", code: "US" }
    ];

    this.groupedCities = [
      {
        label: "Germany",
        value: "de",
        items: [
          { label: "Berlin", value: "Berlin" },
          { label: "Frankfurt", value: "Frankfurt" },
          { label: "Hamburg", value: "Hamburg" },
          { label: "Munich", value: "Munich" }
        ]
      },
      {
        label: "USA",
        value: "us",
        items: [
          { label: "Chicago", value: "Chicago" },
          { label: "Los Angeles", value: "Los Angeles" },
          { label: "New York", value: "New York" },
          { label: "San Francisco", value: "San Francisco" }
        ]
      },
      {
        label: "Japan",
        value: "jp",
        items: [
          { label: "Kyoto", value: "Kyoto" },
          { label: "Osaka", value: "Osaka" },
          { label: "Tokyo", value: "Tokyo" },
          { label: "Yokohama", value: "Yokohama" }
        ]
      }
    ];
  }

  get maxOpenPosition() : number {
    return this.form.get('maxOpenPosition')?.value;
  }

  get slicingQty() : number {
    return this.form.get('slicingQty')?.value;
  }

  get averagePrice() : number {
    return this.form.get('averagePrice')?.value;
  }

  get exitPrice() : number {
    return this.form.get('exitPrice')?.value;
  }

  get startPrice() : number {
    return this.form.get('startPrice')?.value;
  }

  ngOnInit() {
    this.primengConfig.ripple = true;
  }
   // stream of data from websocket 
  marketPrice : any;
  lastBuyPriceByAlgo : number = 0;
  createNoOfTradeArray (n : number) {
    let noOfTrades = []; 
    for (let i = 1 ; i <=n ; i++) {
      noOfTrades.push(i)
    }
    return noOfTrades;
  }
  startScaplingAlgo (marketPrice?:number) {
    let selectedProductType : number =  this.checkProductType();
    let noOfTimeTradeToExecute  = Math.floor(this.maxOpenPosition / selectedProductType);
    // console.log("Quotient:", noOfTimeTradeToExecute); // Output: 3
      console.log('ws price ' , marketPrice)
    this.noOfExectutionToHappen = this.createNoOfTradeArray(noOfTimeTradeToExecute);
    if (marketPrice && marketPrice != undefined)
    // 1) if start price meet start the algo
    // flow 1 market price is equal to start price and then move towards target price , so straight buy and sell flow is flow 1 
   
    // for example cosider 
    // start price as 100
    // exit price as 5 
    // average price as 5
    // here 100 == 100 
   // this.noOfExectutionToHappen.forEach((value , index) => {
      //console.log('loop start', index)
      if (marketPrice == this.startPrice || marketPrice < this.startPrice) {

        // 2) condition meet so place the order 
        // before order place you should be calculated what is lot size should be it is based on order slicing
        // so here need value of what is lot size , (quantity);
  
        // here another logic also be handled , regarding max open position 
        // if max open positin is 100 product type is BN  15 
        // so entry of 100 is blocked by validation must it have 15 Multiply compatable 
        // entry should be 90 / 15 = 0 so 
      
        this.placeOrder(true, this.slicingQty , this.startPrice);
  
  
        // 4 ) now order buy done  ..., so write logic for how to exit , 
        // regarding exit that is main logic , compare the entry price with exit price 
        // here we know what is entry price also know exit price ,
        // exit price  === startPrice + exitPrice different
        // this.findDifferenceBetweenEntryandExit();
        // above one removed and handle this is after placeorder 
        // this.noOfExectutionToHappen[index]--;
      } 
      
      // 5 ) flow 2 buying on second level if market go below after start price 
      // make average based on average price value
      // here buy again
      // 95  == 100 - 5 
      else if (marketPrice == this.startPrice - this.averagePrice ) {
        this.placeOrder(true, this.slicingQty , this.startPrice - this.averagePrice);
        // here preserve last buy price because of what is next buy price values 
        // now next time if market price is checked with this variable
  
        // this.lastBuyPriceByAlgo = 95 
        // because 95 = 100 - 5  
        this.lastBuyPriceByAlgo = this.startPrice - this.averagePrice;
       // this.noOfExectutionToHappen[index]--;
      } 
      // 6 ) flow 3 
      // again market fall from last buy price , calculate ave price different and compare with market price 
      // if meet buy again this is 3 rd time buying happen.
      // 90 = 95 - 5 
      // now this.lastBuyPriceByAlgo = 90
      else if ( marketPrice == this.lastBuyPriceByAlgo - this.averagePrice) {
        this.placeOrder(true, this.slicingQty , this.lastBuyPriceByAlgo - this.averagePrice);
        // 90 = 
        this.lastBuyPriceByAlgo = this.lastBuyPriceByAlgo - this.averagePrice
        // this.noOfExectutionToHappen[index]--;
      } 
    //});

    
    
  }

  placeOrder(buyorsell : boolean, decidedQty : number , buyPrice : number ,orderId? : number ) {
    // 3) before place order check max open position and order slicing mechanism
    // Note : for first time implementation now removing the order slicing , will consider 15 only for BN
    if (buyorsell) {
      console.log('buy')
      // now true so , with 1 lot buy the strike 
      //... will add the snippet of buy call 

      // Store buy order details in the array
     this.buyOrders.push({ orderId, buyPrice });
      console.log('buyorders arrray', this.buyOrders)
    } 

    // sell logic start 
    // Execute sell logic for each buy order with target price reached
   

    if (this.buyOrders.length > 0 ) {
      console.log('wher i am')
      // now buy happended so , try to trigger sell loop
      // both the buy and sell happen async
      // then only it should be good. 
      // because market like that only, don't go continuesly rally or continues down .
      // to execute all orders upto max open position
      this.executeSellOrder();
    }
  }
  executeSellOrder() {
    this.buyOrders.forEach((order : any, orderIndex: any) => {
      if (this.marketPrice >= order.buyPrice + this.exitPrice) {
        this.placeSellOrder(this.slicingQty, order.buyPrice + this.exitPrice);
        this.buyOrders.splice(orderIndex, 1); // Remove the sold order from the array
      }
    });
  }
  placeSellOrder( decidedQty : number , buyPrice : number) {
    // snippet for rest api for sell order
    console.log('sell' , this.buyOrders);
  }
  findDifferenceBetweenEntryandExit() {
    
    // now ws meet exit price 
    if (this.marketPrice == this.exitPrice ) {
      // 4) Sell the strike 
      this.placeOrder(false, this.slicingQty ,this.exitPrice, 0);
    }
  }

  // check product type 
  //if FIN 40 BN 15 N 50 S 10 
  // now to identify if the product is above type nifty or BN 
  // yes based on selected product Object value will confirm which value is possible on 
  // + or - icon 
  checkProductType(productValue?: any) {
    if (productValue) {
      if (productValue.charAt(0) === "B") {
        // Action for strings starting with "B"
        console.log("String starts with 'a'");
        return 15;
      } else if (productValue.charAt(0) === "N") {
        // Action for strings starting with "b"
        console.log("String starts with 'N'");
        return 50;
      }
      else if (productValue.charAt(0) === "F") {
        // Action for strings starting with "b"
        console.log("String starts with 'N'");
        return 40;
      }
      else if (productValue.charAt(0) === "S") {
        // Action for strings starting with "b"
        console.log("String starts with 'N'");
        return 10;
      }
      else if (productValue.charAt(0) === "M") {
        // Action for strings starting with "b"
        console.log("String starts with 'N'");
        return 75;
      }
      
      else {
        // Default action for other cases
        console.log("String starts with a letter other than 'a' or 'b'");
        return 0;
      }
    
    } else {
      return 5
    }
  }

  orderSlicling() {
    // what is order slicing mechanism 
    // based on product type we have to execute the quantity
    // instead of buying 1 LOT or 2 or mentioned lot 
    // get the order slicling value and execute that upto max open position range 

    // for example max open position is 100 
    // order slicling  = it should be validated on enter (based on product type )
    // is BN product type selected
    // it should be divided with 15 and divided balance should be 0 then it is valid quantity  same for other product type also
   let selectedProductType : number =  this.checkProductType();
   var productQuantitiesAreValid : boolean;
   if (this.slicingQty) {
    // 100 / 15 = 10 balance is 10 not zero 
    // 30/15 = 0 
    
    if ( this.slicingQty % selectedProductType === 0 ) {
      productQuantitiesAreValid = true; 
    } else {
      productQuantitiesAreValid = false;
    }
   }
    
    

  }
  checkMentionedQtyAreCorrectLot() {
    return (control: AbstractControl) : any => {
      if (this && this.form != undefined) {
      let selectedProductType : number =  this.checkProductType();
      console.log(this.slicingQty)
      if (this.slicingQty) {
       // 100 / 15 = 10 balance is 10 not zero 
       // 30/15 = 0 
       if ( this.slicingQty % selectedProductType === 0 ) {
         return null;
       } else {
         return { 'isValidLot': true };
       }
      }
      }
    };
  }
  checkMentionedQtyAreCorrectLotForMaxOpenPosition() {
    return (control: AbstractControl) : any => {
      if (this && this.form != undefined) {
      let selectedProductType : number =  this.checkProductType();
      console.log(this.maxOpenPosition)
      if (this.maxOpenPosition) {
       if ( this.maxOpenPosition % selectedProductType === 0 ) {
         return null;
       } else {
         return { 'isValidLot': true };
       }
      }
      }
    };
  }

  startingScaplingAlgo() {

    const subscription: any = this.depthData.messages.subscribe((wsResponse: any) => {
      // console.log('nfo check in scapling component', wsResponse)
      if (wsResponse) {

        if (wsResponse?.e == "NFO") {
          this.startScaplingAlgo(wsResponse?.lp);
          // ( wsResponse?.tk && wsResponse.tk == strategyObject?.scriptid)
        }
      }

    });

  }
  message = {
    "t": "c",
    "uid": "FT032747",
    "actid": "FT032747",
    "source": "API",
    "susertoken": ""
  }
  test() {
    this.WebSocketAuth();
    var ws = new WebSocket('ws://localhost:40510');

    ws.onopen = function () {
        console.log('websocket is connected ...')
        ws.send('connected')
    }

    ws.onmessage = function (ev) {
        console.log(ev);
    }

    this.getSpecificStrickeRateTouchline('123456');
  }
  WebSocketAuth() {
    this.depthData.messages.next(this.message);
    // this.getBankNiftySpecificStrickeRate('26009');
  }

  getSpecificStrickeRateTouchline(s : any) {
    // NSE|22#BSE|508123#NSE|NIFTY
    let strickobject = {
      "t": "t",
      "k": `NFO|${s}`
    };
    this.websocketconnection.getDataFromWS(strickobject);
  }
}
 
