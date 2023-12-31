import {
  AfterViewInit,
  Component,
  ContentChild,
  ElementRef,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { AuthSession } from '@supabase/supabase-js';
import {
  BNStrikeItem,
  Customer,
  CustomerService,
  Representative,
} from '../customer.service';
import { MenuItem, MessageService, PrimeNGConfig } from 'primeng/api';
import { Table } from 'primeng/table';
import { HttpClient } from '@angular/common/http';
import { CommonService } from '../common.service';
import { FlatTradeURLs } from '../app.constants';
import { SupabaseService } from '../supabase.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatTabGroup } from '@angular/material/tabs';
import { ReportsComponent } from '../reports/reports.component';
import { DatasharedService } from '../datashared.service';
import { interval, switchMap, take, map, share } from 'rxjs';
import { DepthDataService } from '../depth-data.service';
import { WebSocketService } from '../web-socket.service';
import { DialogService } from 'primeng/dynamicdialog';
import { BackTestDetailComponent } from '../back-test-detail/back-test-detail.component';
import { StrikeItemForUI } from '../models/strikeItemForUI';
interface AutoCompleteCompleteEvent {
  originalEvent: Event;
  query: string;
}
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  providers: [CustomerService, HttpClient, MessageService, DialogService],
})
export class HomeComponent implements OnInit, AfterViewInit {
  @Input()
  session!: AuthSession;

  customers!: Customer[];
  collectionofStrikes: BNStrikeItem[] = [];

  selectedCustomers!: Customer[];
  selectedcollectionofStrikes!: BNStrikeItem[];

  loading: boolean = true;

  @ViewChild('dt') table!: Table;

  // init algo
  selectedStrike: any;
  suggestions!: any[];

  // dialogs form
  productDialog!: boolean;
  selectedStrikeLevel!: any;
  submitted: boolean = false;
  disableSave: boolean = false;
  date7!: Date;
  rangeDates!: Date[];
  priceLevelsForm = new FormGroup({
    notes: new FormControl(''),
    B1: new FormControl('', [Validators.required]),
    T1: new FormControl('', Validators.required),
    SL: new FormControl('', [Validators.required]),
    token: new FormControl('', [Validators.required]),
    rangeDates: new FormControl([new Date(), new Date()]),
  });

  // menu item define

  // items!:  any[];
  items!: MenuItem[];
  activeItem!: MenuItem;
  // algo logics

  // buy1Triggered: boolean = false;

  // calendar events
  rangeofDates!: any[];

  // loading icon implementation
  blockUI: boolean = false;

  // mat tab
  @ViewChild('tabGroup') tabGroup!: MatTabGroup;
  @Input()
  tabinput!: any;

  @ViewChild('reports') reports!: ReportsComponent;
  @ContentChild('childComponent') ReportsComponent!: ReportsComponent;


  chartDataInterval$: any;

  strategyies: any[] = [];
  algoinitiaedTokens: any[] = [];
  cities!: any[];
  selectedCity: any;
  // interval array to stop specific interval from loop
  subscriptions: any= [];
  parentStrikeInterval$: any;
  message = {
    "t": "c",
    "uid": "FT032747",
    "actid": "FT032747",
    "source": "API",
    "susertoken": ""
  }
  // added for feature - show overall points collected by hole strike all child strategies overall p or l points
  totalNegativeSum : any = 0;
  totalPositiveSum: any = 0;
  constructor(
    private dataService: DatasharedService,
    private elementRef: ElementRef,
    private router: Router,
    private messageService: MessageService,
    private readonly supabase: SupabaseService,
    private customerService: CustomerService,
    private httpClient: HttpClient,
    private flattradeService: CommonService,
    private primengConfig: PrimeNGConfig,
    public depthData: DepthDataService,
    public websocketconnection: WebSocketService,
    public dialogService: DialogService
  ) { 
    this.cities = [
      {name: '1 M', code: 'NY'},
      {name: '2 M', code: 'RM'},
      {name: '3M', code: 'LDN'},
      {name: '5M', code: 'IST'},
      {name: '30 sec', code: 'PRS'}
  ];

  }

  // search the script name
  search(event: AutoCompleteCompleteEvent) {
    let getToken = this.flattradeService.getUserObjectFromLocalStorage();
    let bodyOfuserDetails = {};
    const jKey = getToken?.token;
    bodyOfuserDetails = `jData={
        "uid":"${getToken?.client}",
      "stext":"${event?.query}"}&jKey=${jKey}`;
    this.httpClient
      .post(FlatTradeURLs.SEARCHSCRIPS, bodyOfuserDetails)
      .subscribe((scriptsResult: any) => {
        this.suggestions = scriptsResult.values;
      });
  }

  showYesterDateData() {
    const today = new Date(); // Current date and time
today.setHours(0, 0, 0, 0); // Set time to 00:00:00

const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1); // Set the date to yesterday

this.collectionofStrikes.forEach((eachStrike: any) => {
  const itemDate = new Date(eachStrike.created_at);
  const itemDateWithoutTime = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate()); // Set time to 00:00:00

  // Compare the dates
  if (itemDateWithoutTime.getTime() >= yesterday.getTime() && itemDateWithoutTime.getTime() < today.getTime()) {
    eachStrike.hideStrikeinUI = false;
  } else {
    eachStrike.hideStrikeinUI = true;
  }
});
// public static APIKEY = "22184d71bc3c4567bae04f1b485b53ae";
// public static SECRETKEY = "2023.15c01a80046f44948f272c3144abdc3bb1b7f5047713cf6c";
  }
  ngOnInit() {
    // , routePath: '/backtestreports'
    // routePath: '/bnlevels'
    this.items = [
      { label: 'Home', icon: 'pi pi-fw pi-home' },
      { label: 'BN levels', icon: 'pi pi-fw pi-calendar' },
      { label: 'Edit', icon: 'pi pi-fw pi-pencil' },
      { label: 'Documentation', icon: 'pi pi-fw pi-file' },
      { label: 'Settings', icon: 'pi pi-fw pi-cog' },
    ];
    this.activeItem = this.items[0];
    // load list of strike from service database
    this.customerService.getSelectedStrikes().then((customers) => {
     
      if (customers.data != null) {
       // Get the current date
const currentDate = new Date();
const today = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
       this.collectionofStrikes = customers.data;
       this.getlayouts();
       this.collectionofStrikes.forEach( (eachStrike : any) => {
        const itemDate = new Date(eachStrike.created_at);
        const itemDateWithoutTime = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate()); // Set time to 00:00:00
      
        // Compare the dates, excluding today
        // if (itemDateWithoutTime < today) {
        //   eachStrike.hideStrikeinUI = true;
        // } else {
        //   eachStrike.hideStrikeinUI = false;
        // }
       });
       this.collectionofStrikes.map((strike: any) => {
        if (strike?.show_to_trade == null) {
          strike.show_to_trade = false;
        }
         this.getCloneValues(strike);
       });
       this.loading = false;
     } 
      },() => {
        this.getRunningAlogs();
      }
      
    );
    this.primengConfig.ripple = true;

    // this.priceLevelsForm?.get('rangeDates')?.valueChanges.subscribe((value: any) => {
    //   console.log('Selected Date Range:', value);
    //   this.rangeofDates = [];
    //   this.formatDateAsRequired(value)
    // });

    this.webconfig();
  }

  webconfig() {
    let getToken = this.flattradeService.getUserObjectFromLocalStorage();
     this.message = {
      "t": "c",
      "uid": "FT032747",
      "actid": "FT032747",
      "source": "API",
      "susertoken": `${getToken?.token}`
    }
  }

  // algo init
  // auto complete search event trigger
  // once event triggered , directly inserted in market feed table
  async selectedStrikeEvent(e: any) {
    console.log(e);
    // insert into market watch table
    this.supabase.insertMarketWatch(e).then((e: any) => {
      if (e?.data) this.collectionofStrikes.push(e?.data[0]);
    });
  }

  // main form entry
  setTarget(strike: any) {
    // this.selectedStrikeLevel = [];
    this.disableSave = false;
    this.selectedStrikeLevel = { ...strike };
    console.log('this.selectedStrikeLevel', this.selectedStrikeLevel);

    if (
      this.selectedStrikeLevel != null &&
      this.selectedStrikeLevel !== undefined
    ) {
      this.supabase
        .getPriceValuesFromPriceTable(this.selectedStrikeLevel?.token)
        .then((tokenValues: any) => {
          console.log('form response', tokenValues?.data);
          this.priceLevelsForm
            ?.get('token')
            ?.setValue(this.selectedStrikeLevel?.token);
          if (tokenValues?.data?.length != 0) {
            this.disableSave = true;
            let strikesPricesLevels = tokenValues?.data[0];
            this?.priceLevelsForm
              ?.get('notes')
              ?.setValue(strikesPricesLevels?.notes);
            this?.priceLevelsForm?.get('B1')?.setValue(strikesPricesLevels?.B1);
            this?.priceLevelsForm?.get('T1')?.setValue(strikesPricesLevels?.T1);
            this?.priceLevelsForm?.get('SL')?.setValue(strikesPricesLevels?.SL);
            this.priceLevelsForm.controls.rangeDates.setValue([
              this.reFormatDateObjectToCalendar(
                strikesPricesLevels?.start_date
              ),
              this.reFormatDateObjectToCalendar(strikesPricesLevels?.end_date),
            ]);
          } else {
            this.priceLevelsForm.reset();
            this.priceLevelsForm
              ?.get('token')
              ?.setValue(this.selectedStrikeLevel?.token);
          }
        });
    }

    this.productDialog = true;
  }

  hideDialog() {
    this.productDialog = false;
    this.submitted = false;
  }

  get getrangeDate() {
    let daterangeobject = {
      start_date: '',
      end_date: '',
    };
    let valueofdate: any = this.priceLevelsForm.get('rangeDates')?.value;
    // console.log('valueofdate' , valueofdate)
    daterangeobject.start_date = this.formatDateAsRequired(valueofdate[0]);

    daterangeobject.end_date = this.formatDateAsRequired(valueofdate[1], true);
    return daterangeobject;
  }
  // T1 & B1 Form submit button trigger save flow

  saveLevels() {
    if (this.priceLevelsForm.valid) {
      const formData = this.priceLevelsForm.value;
      // console.log('save area' , this.priceLevelsForm.get('rangeDates')?.setValue(this.rangeofDates[0]))
      this.supabase
        .insertToStrikePrice(formData, this.getrangeDate)
        .then((data: any) => {
          console.log('data', data);
          this.productDialog = false;
          this.showSuccess('success', 'success', 'Saved');
        });
      // Perform actions with formData
    } else {
      // Handle validation errors
    }
  }

  // edit form

  modifyLevels() {
    if (this.priceLevelsForm.valid) {
      const formData = this.priceLevelsForm.value;
      console.log('Form Data:', formData);
      this.supabase
        .updateToStrikePrice(formData, this.getrangeDate)
        .then((data: any) => {
          this.showSuccess(
            'success',
            'Sucess',
            `${formData?.token} B1 and T1 Updated`
          );
          console.log('data' , formData?.token)
         let updatedFormItem = {
          notes: formData?.notes,
          B1: formData?.B1,
          T1: formData?.T1,
          SL: formData?.SL,
          start_date: '',
          end_date: '',
          strategy_id : formData?.token,
          strategyid : formData?.token
         }
         // below we doing this for updating child array of ptable value
         // because once form value changed or updated , changed values are not shown in UI 
         // to resolve that below find index of main array index  ,
         // then filter which child item value need to updated also formData container updated values
         // so this we update front end 
         const index = this.collectionofStrikes.findIndex(
          (item) => item.token === this.selectedStrikeLevel.token
        );
        if (index !== -1) {
          let needtoUpdatedStrategyValue = this.collectionofStrikes[index].cloneForm.
             filter( ( eachStrategy : any)=> eachStrategy?.id == formData?.token);
          needtoUpdatedStrategyValue[0].b1 = formData?.B1;
          needtoUpdatedStrategyValue[0].t1 =formData?.T1;
          needtoUpdatedStrategyValue[0].sl = formData?.SL;
        }
         this.dataService.updateB1(updatedFormItem);
          if (data?.length > 0) {
          }
          this.productDialog = false;
        });
      // Perform actions with formData
    } else {
      // Handle validation errors
    }
  }

  deleteStrike(strike: any) {
    this.supabase.deleteMarketWatch(strike).then((deleteResponse: any) => {
      console.log('del', deleteResponse);
      if (deleteResponse?.data?.length != 0) {
        let index = this.collectionofStrikes.findIndex(
          (obj) => obj.id === deleteResponse?.data[0]?.id
        );
        if (index !== -1) {
          this.collectionofStrikes.splice(index, 1);
          this.showSuccess(
            'error',
            'Error',
            'Strike Level Removed from Application'
          );
        } else {
          console.log(`Not found`);
        }
      }
    });
  }
  // after every thing is set in form
  // initiedAlgoStrike: any;
  buy1Triggered: boolean = false;
  target1Triggered: boolean = false;

  // priviously used and will use for back testing the data
  initAlgosdfsfsafsf(price: any) {
    console.log(price);
    // get strategy form values from table
    this.supabase
      .getPriceValuesFromPriceTableByID(price?.id)
      .then((tokenValues: any) => {
        if (tokenValues?.data?.length != 0) {
          let B1 = tokenValues?.data[0]?.B1;
          let T1 = tokenValues?.data[0]?.T1;
          let SL = tokenValues?.data[0]?.SL;
          let startdate = tokenValues?.data[0]?.start_date;
          let enddate_ = tokenValues?.data[0]?.end_date;
          let buy1Triggered = false;
          let target1Triggered = false;
          // this.getStrikeDataByChart(price?.token).subscribe((data: any) => {

          this.customerService.getindexValues().then((data: any) => {
            let selectedDateValues: any;
            console.log('totel length', data);
            //  arrayOfObjects = this.getLast10DaysData(data);
            selectedDateValues = this.filterSelectedDateRangeFromSource(
              data,
              startdate,
              enddate_
            );
            console.log('after range filter', selectedDateValues);
            var THIS = this;
            let currentIndex = 0;
            function getValueEveryMinute(outerthis: any) {
              // Check if we have reached the end of the array
              if (currentIndex >= selectedDateValues?.length) {
                console.log('end here', outerthis);
                console.timeEnd('myTimer');
                clearInterval(intervalId);
                // currentIndex = 0; // Reset to the beginning of the array
              }
              const objectToReturn = selectedDateValues[currentIndex];
              currentIndex++;
              return objectToReturn;
            }
            function handlePlaceOrderduplicateorder(object: any, outerthis: any) {
              let openPrice = object?.into;
              let closePrice = object?.intc;
              let highPrice = object?.inth;
              let lowPrice = object?.intl;
              if (!buy1Triggered) {
                if (closePrice < B1) {
                  buy1Triggered = true;
                  console.log('buying @ B1 level', price?.id);
                  outerthis.initiedAlgoStrike.order_type = true;
                  outerthis.initiedAlgoStrike.time_happened = object?.time;
                  outerthis.initiedAlgoStrike.B1 = closePrice;
                  outerthis.initiedAlgoStrike.strategy_id = price?.id;
                  outerthis.supabase
                    .insertToBacktesting(outerthis.initiedAlgoStrike)
                    .then((data: any) => {
                      // console.log('data' , data)
                    });
                }
              } else {
                // console.log('not triggered')
              }
              if (buy1Triggered && !target1Triggered) {
                if (highPrice == T1 || highPrice > T1) {
                  console.log('close the trade ', price?.id);
                  target1Triggered = true;
                  buy1Triggered = false;
                  target1Triggered = false;
                  outerthis.initiedAlgoStrike.order_type = false;
                  outerthis.initiedAlgoStrike.time_happened = object?.time;
                  outerthis.initiedAlgoStrike.B1 = closePrice;
                  outerthis.initiedAlgoStrike.strategy_id = price?.id;
                  outerthis.supabase
                    .insertToBacktesting(outerthis.initiedAlgoStrike)
                    .then((data: any) => {
                      // console.log('update back testing data' , data)
                    });
                }
              }
            }
            console.time('myTimer');
            let intervalId = setInterval(() => {
              // Your code here
              const object = getValueEveryMinute(THIS);
              // console.log('Object:', object);

              // yes this syntax seem like old
              // calling method inside setinterval
              // handlePlaceOrder(object, THIS);
              // Check the condition
              // if (conditionIsMet) {
              //   // Clear the interval when the condition is met
              //   clearInterval(intervalId);
              // }
            }, 1); // 1000 milliseconds = 1 second
          });
        }
      });
  }





  filterSelectedDateRangeFromSource(
    data: any,
    start_date: string,
    end_date: string
  ) {
    console.log('check it in array format', typeof data)
    const filteredData = data.filter((item: any) => {
      const itemDate = this.oncompareFormatDate(item.time);
      return (
        itemDate >= this.oncompareFormatDate(start_date) &&
        itemDate <= this.oncompareFormatDate(end_date)
      );
    });
    return filteredData.reverse();
  }

  // handle calender events

  formatDateAsRequired(dateobject: any, enddate?: boolean) {
    //  dateobject?.forEach((item: any) => {
    // Original date string
    const originalDateString = dateobject;
    // Create a Date object from the original date string
    const originalDate = new Date(originalDateString);
    // Format the original date
    const formattedDate = this.formatDate(originalDate, enddate);
    // this.startDateRange
    console.log(formattedDate); // Output: "20-09-2023 23:50:10"
    return formattedDate;
    //   this.rangeofDates.push(formattedDate)
    //  });
  }

  // Create a function to format the date into "DD-MM-YYYY HH:mm:ss" format
  formatDate(date: any, enddate: boolean = false) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Note: Months are 0-based
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    let nineand15min = '09';
    let startmin = '15';
    if (enddate) {
      nineand15min = '15';
      startmin = '30';
    }

    return `${day}-${month}-${year} ${nineand15min}:${startmin}:00`;
  }
  reFormatDateObjectToCalendar(dateString: any) {
    // const dateString = "14-09-2023 09:15:00";

    // Split the date string into its components
    const [datePart, timePart] = dateString.split(' ');
    const [day, month, year] = datePart.split('-').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);

    // Create a JavaScript Date object
    const dateObject = new Date(year, month - 1, day, hours, minutes, seconds);
    return dateObject;
    // console.log(dateObject);
  }

  // when compare below used to
  // here convert the both date format to standard format before filter data
  oncompareFormatDate(dateTimeObject: any) {
    const dateTimeString = dateTimeObject;

    // Split the date-time string into date and time parts
    const [datePart, timePart] = dateTimeString.split(' ');
    const [day, month, year] = datePart.split('-').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);

    // Create a JavaScript Date object
    const dateObject = new Date(year, month - 1, day, hours, minutes, seconds);
    return dateObject;
  }
  // add another form with same strike again B1 and T1 Sl so will do
  cloneform(strike: any) {
    console.log(strike);
    this.supabase
      .insertToStrikePrice(strike, this.getrangeDate)
      .then((data: any) => {
        this.getCloneValues(strike);
      });
  }

  // create strategy from parent strike using below method
  getCloneValues(strike: any) {
    // getting strategey values from table
    this.supabase
      .getPriceValuesFromPriceTable(strike?.token)
      .then((tokenValues: any) => {
        if (tokenValues?.data?.length != 0) {
          const index = this.collectionofStrikes.findIndex(
            (item) => item.id === strike?.id
          );

          if (index !== -1) {
            const cloneitem = this.collectionofStrikes.find(
              (strikeeach) => strikeeach.id == strike?.id
            );
            let cloneItemsofArray: any = [];
            tokenValues?.data.map((tokenvalues: any) => {
              cloneItemsofArray.push({
                dname: cloneitem?.dname,
                tsym: cloneitem?.tsym,
                optt: cloneitem?.optt,
                token: cloneitem?.token,
                id: tokenvalues?.id,
                b1: tokenvalues?.B1,
                t1: tokenvalues?.T1,
                sl: tokenvalues?.SL,
                strategyCreatedTime :tokenvalues?.created_at,
                isRunning : tokenvalues?.s_running_status ?  tokenvalues?.s_running_status : false
              });
            });
            // cloneForm is array created for child ptable list
            this.collectionofStrikes[index].cloneForm = cloneItemsofArray;
            this.collectionofStrikes[index]?.cloneForm.map((childStrategy: any) => {
              this.initAlgoRealTime(childStrategy);
              this.getReportsData(childStrategy , this.collectionofStrikes[index]);
            });
          //  this.showSuccess('info', 'Success', 'Strategy Added');      
          } else {
            console.log(`Item with id ${strike?.id} not found in the array`);
          }
        }
      });
  }
  // clone item flow
  setTargetofClone(strike: any) {
    this.disableSave = false;
    this.selectedStrikeLevel = { ...strike };
    console.log('setTargetofClone', this.selectedStrikeLevel);

    if (
      this.selectedStrikeLevel != null &&
      this.selectedStrikeLevel !== undefined
    ) {
      this.supabase
        .getPriceValuesFromPriceTableByID(this.selectedStrikeLevel?.id)
        .then((tokenValues: any) => {
          console.log('form response', tokenValues?.data);
          this.priceLevelsForm
            ?.get('token')
            ?.setValue(this.selectedStrikeLevel?.id);
          if (tokenValues?.data?.length != 0) {
            this.disableSave = true;
            let strikesPricesLevels = tokenValues?.data[0];
            this?.priceLevelsForm
              ?.get('notes')
              ?.setValue(strikesPricesLevels?.notes);
            this?.priceLevelsForm?.get('B1')?.setValue(strikesPricesLevels?.B1);
            this?.priceLevelsForm?.get('T1')?.setValue(strikesPricesLevels?.T1);
            this?.priceLevelsForm?.get('SL')?.setValue(strikesPricesLevels?.SL);
            this.priceLevelsForm.controls.rangeDates.setValue([
              this.reFormatDateObjectToCalendar(
                strikesPricesLevels?.start_date
              ),
              this.reFormatDateObjectToCalendar(strikesPricesLevels?.end_date),
            ]);
          } else {
            this.priceLevelsForm.reset();
            this.priceLevelsForm
              ?.get('token')
              ?.setValue(this.selectedStrikeLevel?.token);
          }
        });
    }
    this.productDialog = true;
  }

  // delete child clone form logics

  deleteStrikePricelevels(strike: any) {
    console.log('log del', strike);
    this.supabase.deleteStrikePrice(strike).then((deleteResponse: any) => {
      if (deleteResponse?.data?.length != 0) {
        let MarketFeedListindex = this.collectionofStrikes.findIndex(
          (obj) => obj.token == deleteResponse?.data[0]?.token
        );
        if (MarketFeedListindex !== -1) {
          let cloneArrayIndex = this.collectionofStrikes[
            MarketFeedListindex
          ].cloneForm.findIndex(
            (obj: any) => obj.id == deleteResponse?.data[0]?.id
          );
          this.collectionofStrikes[MarketFeedListindex].cloneForm.splice(
            cloneArrayIndex,
            1
          );
          this.showSuccess(
            'error',
            'Error',
            'Strategy Removed from Application'
          );
        } else {
          console.log(`Not found`);
        }
      }
    });
  }

  // toast service

  showSuccess(severity: string, summary: string, msg: string) {
    this.messageService.add({
      severity: severity,
      summary: summary,
      detail: msg,
    });
  }

  getReports(tabIndex: number, cloneitem: any): void {

    // this.router.navigate(['/backtestreports']);
    // Ensure tabIndex is within valid bounds
    if (tabIndex >= 0 && tabIndex) {
      this.tabinput.selectedIndex = tabIndex;
      // Simulate a login action
      this.dataService.updateStrikeDetailObservable(cloneitem);
    }
  }

  ngAfterViewInit() {
    console.log('view init', this.ReportsComponent);
  }

  // get data from chart
  // this also gives specific strick data
  // but response time long compare to websocket

  getStrikeDataByChart(token: any): any {
    let currenttime = new Date().toLocaleString();
    let getToken = this.flattradeService.getUserObjectFromLocalStorage();
    let bodyOfplaceOrder = {};
    bodyOfplaceOrder = `jData={"uid":"${getToken?.client}","exch":"NFO",
    "token":"${token}",
    "st":"${currenttime}",
    "intrv":"1"}&jKey=${getToken?.token}`;

    // to do web workder call
    // if (typeof Worker !== 'undefined') {
    //   const worker = new Worker(new URL('../app.worker', import.meta.url));
    //   worker.postMessage({ functionName: 'makeRequest', num1: bodyOfplaceOrder }); // Send data to the worker
  
    //   worker.onmessage = ({ data }) => {
    //     console.log('Result 1:', data);
    //     console.log('Result from worker:', data.result);

       
    //   // return observable;
      
    //   };

    // } else {
    //   console.log('not support on this env')
    //   // Web Workers are not supported in this environment.
    //   // You should add a fallback so that your program still executes correctly.
    // } 

    return this.httpClient.post(
      FlatTradeURLs.TIMEPRICESeries,
      bodyOfplaceOrder
    )
    // .pipe(
    //   map((response) => {
    //     const modifiedResponse = {
    //       scriptData: response,
    //       scriptid: token,
    //     };
    //     return modifiedResponse;
    //   })
    // );

  }

  startAll_Algo_UnderthisStrike(mainStrikeToken: any) {
    console.log('parent clicked', mainStrikeToken)
    if (mainStrikeToken) {
      // this.getChartDataByMinNew(mainStrikeToken?.token)
      mainStrikeToken?.cloneForm.map((childStrategy: any) => {
        this.initAlgoRealTime(childStrategy)
      })
    }
  }
  // revisite here why this function not used  ? 
  // got it this is used before web socket flow integration 
  startAlgo(token: any, strategy_id: number, dname : string, strikename: string) {
     // this.webworker.startWorker();
    // 10000 == 1 sec
    // this.getBankNiftySpecificStrickeRateTouchline(token);
    this.getSpecificStrickeRateTouchline(token);
    
    const apiInterval = 26000; // 40 seconds in milliseconds
    console.log('new logic check start api call on parent strike click', token)
     this.strategyies.filter((strategyObject: any) => {
      if (strategyObject?.strategy_id == strategy_id) {
        strategyObject.isRunning = true;
        this.supabase.updateToStrikePrice({
          s_running_status : true,
          token: strategyObject?.strategy_id
        });
        return strategyObject;
      } else {
        return;
      }
    });
    // on play click show and hide pause or play button logic
    this.findAndUpdateCollectionArray(token , strategy_id, true)
    // check the isRunning is true it mean it is algo started so save that status in localstorage
    // let runningAlgo = this.eachchildvalue.filter( strategyId =>  strategyId?.isRunning) ;
   

    this.parentStrikeInterval$ = interval(apiInterval).pipe(
     // share(), // Use the share operator to make the observable shared
      switchMap(() =>
           this.getStrikeDataByChart(token)

         //this.customerService.get43800CEdata(token)
      )
    );
    if (this.parentStrikeInterval$) {
      let currentIndex = 0;
      const subscription  : any= this.parentStrikeInterval$?.subscribe((data: any) => {
        // const index = this.subscriptions.indexOf(subscription);
        // const customData = this.subscriptions[index]?.customData;
        // let reverseArrayOrder = data?.scriptData.reverse();
       // let reverseArrayOrder = data?.reverse();
      //   console.log('Next: ', reverseArrayOrder);
        // this.eachchildvalue.filter((strategyid: any) => {
        // now again we don't need to filter on array now we have stragety id which
        //  values only need to checked with response price  strategy_id
      //  console.log('on real check' , this.eachchildvalue);
        this.dataService.b1$.subscribe((updatedB1value : any) => {
            this.strategyies.forEach((strategyid:any) => {
               if (strategyid.strategy_id == updatedB1value?.strategy_id ) {
                strategyid.b1 = updatedB1value?.B1;
                strategyid.t1 = updatedB1value?.T1;
                strategyid.sl = updatedB1value?.SL;
                
               }
            })
              });

        let eachstratey = this.strategyies.filter((strategyObject: any) => {
          if (strategyObject?.strategy_id == strategy_id) {
            return strategyObject;
          } else {
            return;
          }
        });
        // let objectdata = getValueEveryMinute(THIS);
        let objectdata = data[0];
        console.log('objectdata', objectdata)
        // this.handlePlaceOrder(objectdata,
        //   eachstratey[0] , dname , strikename);
        //  if (strategyid?.scriptid == data?.scriptid) {
        // if (strategyObject?.strategy_id == strategy_id ) {
        //  let childCloneItemValues = {
        //   strategyobject : strategyObject,
        //   strikeData: reverseArrayOrder
        // }

        //   // this.filterByDate(childCloneItemValues?.strikeData, childCloneItemValues.strategyobject?.startdate, childCloneItemValues.strategyobject?.enddate)


        // console.log('filter ' , eachstratey)
        // this.handlePlaceOrder(data[0], B1, T1, price);

        // dont delete below one will used for fake api call response
        // var THIS = this;
        // function getValueEveryMinute(outerthis: any) {
        //   // Check if we have reached the end of the array
        //   if (currentIndex >= reverseArrayOrder?.length) {
        //     console.log('end here', outerthis);
        //     // outerthis?.parentStrikeInterval$?.unsubscribe();
        //     // currentIndex = 0; // Reset to the beginning of the array
        //   }
        //   const objectToReturn = reverseArrayOrder?.[currentIndex];
        //   currentIndex++;
        //   return objectToReturn;
        // }
        // this.filterByDate(childCloneItemValues?.strikeData, childCloneItemValues.strategyobject?.startdate, childCloneItemValues.strategyobject?.enddate)
          // Store the subscription in an array
        // Store the subscription and custom data in an object
        const subscriptionData = {
          subscription: subscription,
          strategy_id: strategy_id
        };
       this.subscriptions.push(subscriptionData);
      }
      );  
    }
  }
  ArrayofObject: any[] = [];
  handlePlaceOrder(object: any, strageryFormValues: any) {
    let B1 = strageryFormValues?.b1;
    let T1 = strageryFormValues?.t1;
    let SL = parseFloat(strageryFormValues?.sl);
    let strateguniqueid = strageryFormValues?.strategyid;
    let strikeUniqueid = strageryFormValues?.tsym;
    let openPrice = object?.into;
    // let closePrice = parseFloat(object?.intc);
    // let highPrice = parseFloat(object?.inth);
    // for websocket changing below 
     let closePrice = parseFloat(object?.lp);
    let highPrice = parseFloat(object?.lp);
    let lowPrice = object?.intl;
    // reveresedchidlforms.forEach((i: any) => {
      // option buy logic
    if (!strageryFormValues?.buytriggered) {

      // buy block insert objects 
     let buyObjects : any = {}

      // calculate different between closePrice and B1
      if (Math.abs(closePrice - B1) <= 5 && closePrice < B1) {
        buyObjects.order_type = true;
        buyObjects.time_happened = object?.time;
        buyObjects.B1 = closePrice;
        buyObjects.strategy_id = strateguniqueid;
        strageryFormValues.buytriggered = true;

        // main logic to place buy order 
        this.supabase
          .insertToBacktesting(buyObjects)
          .then((data: any) => {
          });
         // B1_triggered strategy_id  token
          this.supabase.updateToStrikePrice(
            {
              buytriggered: true,
              token: strateguniqueid
            }
          ).then((updatedToBackEnd:any) => {
            console.log('updatedToBackEnd' , updatedToBackEnd)
            // now order is triggered , ui need to know which sid is triggered so , will use ng class to style 
            // strateguniqueid is s_id , 
            // using this possible to update UI right ?
            // yes but it need to be updated continuesly , because this block of code will run frequently based on B1 T1 SL 
            // need to maintain array of objects , each object should contain triggered key 
            // it should be boolean 
            this.triggeredOrNot(object?.tk,strateguniqueid,true );
          });
          // this.setDynamicAlert(`${strikename} buying call` ,strikeUniqueid, closePrice, "B");
          this.placeOrder(strikeUniqueid, closePrice,"B" )
      }
    } else {

      // below tested with t1 scenorios there is not confusion between same sid buy or sell
      if (strageryFormValues.buytriggered && !strageryFormValues.selltriggered) {
        if (highPrice == T1 || highPrice > T1) {

           // sell block insert objects 
         let sellObjects : any = {}


          strageryFormValues.selltriggered = true;
          strageryFormValues.buytriggered = false;
          strageryFormValues.selltriggered = false;


          // update server side value as well to get even on refresh the page 
          // just implementation testing 

          this.supabase.updateToStrikePrice(
            {
              buytriggered: false,
              token: strateguniqueid,
              selltriggered : false
            }
          ).then((updatedToBackEnd:any) => {
            console.log('in sell condition' , updatedToBackEnd)
          })

          sellObjects.order_type = false;
          sellObjects.time_happened = object?.time;
          sellObjects.B1 = highPrice;
          sellObjects.strategy_id = strateguniqueid;
          this.supabase
            .insertToBacktesting(sellObjects)
            .then((data: any) => {
            });
            this.triggeredOrNot(object?.tk,strateguniqueid,false );

            // dynamic alert set 
           // this.setDynamicAlert(`${strikename} selling call alert` ,strikeUniqueid, highPrice, "S");
            this.placeOrder(strikeUniqueid, highPrice, "S" );
        }
        // it mean b1 executed and sell also not executed sl also not triggered
        if (strageryFormValues.buytriggered && !strageryFormValues.selltriggered &&
           !strageryFormValues.sltriggered) {
            // there is open position in trade , need to decide what to do based on sl flow 
            // what is SL mean if defined SL form values meet the closedprice need to trigger SL 
            // mean values is below b1 range
            if (closePrice == SL  || closePrice < SL ) {
               // SL block insert objects 
            let sLObjects : any = {}

              strageryFormValues.selltriggered = true;
              strageryFormValues.sltriggered = true;

              // need to decide on below 2 line logic 
              // reset all object to back to default // because need to take one position next iteration
              strageryFormValues.buytriggered = false;
              strageryFormValues.selltriggered = false;
              strageryFormValues.sltriggered = false;


              this.supabase.updateToStrikePrice(
                {
                  buytriggered: false,
                  token: strateguniqueid,
                  selltriggered : false,
                  sltriggered : false
                }
              ).then((updatedToBackEnd:any) => {
                console.log('in sell condition' , updatedToBackEnd)
              })


              // insert to table with new coloum value
              sLObjects.sl_trigger = true;
              sLObjects.order_type = false;
              sLObjects.time_happened = object?.time;
              sLObjects.B1 = closePrice;
              sLObjects.strategy_id = strateguniqueid;
              this.supabase
            .insertToBacktesting(sLObjects)
            .then((data: any) => {
            });

            this.triggeredOrNot(object?.tk,strateguniqueid,false );

            // SL trigger alert 
           // this.setDynamicAlert(`${strikename} SL call alert` ,strikeUniqueid, highPrice, "S");
            this.placeOrder(strikeUniqueid, highPrice, "S" )
            }
          
        }
        
      }
    }
  }
  dynamicArrays: any[] = [];
  initAlgoRealTime(childStrategyId: any) {

    // get strategy form values from table
    this.supabase
      .getPriceValuesFromPriceTableByID(childStrategyId?.id ? childStrategyId?.id : childStrategyId)
      .then((tokenValues: any) => {
        if (tokenValues?.data?.length != 0) {
          let B1 = tokenValues?.data[0]?.B1;
          let T1 = tokenValues?.data[0]?.T1;
          let SL = tokenValues?.data[0]?.SL;
          let startdate = tokenValues?.data[0]?.start_date;
          let enddate = tokenValues?.data[0]?.end_date;
          let token = tokenValues?.data[0]?.token;
          let id = tokenValues?.data[0]?.id;
          let serverSide_B1_trigger_value = tokenValues?.data[0]?.buytriggered;
          let serverSide_T1_trigger_value = tokenValues?.data[0]?.selltriggered;
          let serverSide_SL_trigger_value = tokenValues?.data[0]?.sltriggered;
          let placeorderstrikename = tokenValues?.data[0]?.tsym;
          // this.getChartDataByMin(price, startdate, enddate, B1, T1);
          let pricelevelobject = {
            strategyid: childStrategyId?.id,
            scriptid: token,
            b1: B1,
            t1: T1,
            sl: SL,
            startdate: startdate,
            enddate: enddate,
            buytriggered: serverSide_B1_trigger_value ? serverSide_B1_trigger_value : false ,
            selltriggered: serverSide_T1_trigger_value ? serverSide_T1_trigger_value : false,
            sltriggered: serverSide_SL_trigger_value ? serverSide_SL_trigger_value : false,
            strategy_id: id,
            tsym:placeorderstrikename,
            stopStrategyById:undefined,
            // b1serervalue : serverSide_B1_trigger_value
          }
          // const newArray: any[] = [pricelevelobject]; // Create a new empty array
          // this.dynamicArrays.push(newArray);
          this.strategyies?.push(pricelevelobject);
          // console.log('on push check main arrrya ' , this.eachchildvalue);

          // need to check below line is need for further ???
          // after edit of on running only need to update the b1 and t1 values ? right ? what is use of below one
          // any how now works as expected need to backtest and need to remove in further if unwanted means
          this.dataService.updateB1(pricelevelobject);
        }
      });
  }

  filterByDate(data: any, startdate: any, enddate_: any) {
    let selectedDateValues: any;
    console.log('totel length', data);
    // let datas : any [] = [];
    //  datas.push(data)
    //  arrayOfObjects = this.getLast10DaysData(data);
    selectedDateValues = this.filterSelectedDateRangeFromSource(
      data,
      startdate,
      enddate_
    );
    console.log('after range filter', selectedDateValues);
  }
  // pause algo mean stop the trade running on this condition
  pause: boolean = false;
  pauseAlgo(strike: any) {
    console.log('pause' , strike?.token)
    this.supabase.updateToStrikePrice({
      s_running_status: !strike?.isRunning,
      token: strike?.id
    });
    // To stop a specific interval, call unsubscribe on the corresponding subscription
    let selectedSub = this.subscriptions.filter((f: any) => {
      if (f?.strategy_id == strike?.id) {
        return f;
      }
    });
    this.unsubscribeAll(selectedSub);

    const index = this.collectionofStrikes.findIndex(
      (item) => item.token === strike?.token
    );
    if (index !== -1) {
      let needtoUpdatedStrategyValue = this.collectionofStrikes[index].cloneForm.
         filter( ( eachStrategy : any)=> eachStrategy?.id == strike?.id);
      needtoUpdatedStrategyValue[0].isRunning = false;
      needtoUpdatedStrategyValue[0].triggered = undefined;
    }

    this.showSuccess('success', 'success', 'Algo Stopped');

    // find by strategy id and remove it 
    // logic to stop the specific s_id from taking position
    // in some situtation unlimited trade happen to stop that s _ id is  very important
    // so strategyies array is main array have all s_id
    // find index which one have to stop then add stopsbyid extra key to specific item
    // so in websocket flow time will filter and not to take trade 
    const index2 = this.strategyies.findIndex(
      (item) => item.strategyid === strike?.id
    );
    if (index2 !== -1) {
      this.strategyies[index2].stopStrategyById =  true;
    }
  }
  unsubscribeAll(selectedSub : any) {
    selectedSub.forEach( ( subscription : any )=> {
      subscription?.subscription.unsubscribe();
    });
  }

  setDynamicAlert(BuyingStrike : string , tsym : any, priceToBuy : any , BorS: any) {
    console.log('here buy and sell values' )
    this.placeOrder(tsym, priceToBuy,BorS )
    let getToken = this.flattradeService.getUserObjectFromLocalStorage();
      let SetAlert = {
      };
      SetAlert = `jData={
        "uid":"${getToken?.client}",
        "tsym":"${tsym}",
        "exch":"NFO",
        "ai_t":"LTP_B",
        "validity":"GTT",
        "d":"${priceToBuy}",
        "remarks":"${BuyingStrike} is triggered for buy "
      }
     &jKey=${getToken?.token}`;
      this.httpClient.post(FlatTradeURLs.SetAlert, SetAlert).subscribe((SetAlert: any) => {
         console.log('buy Trigger alert' , SetAlert);
         if (SetAlert?.al_id) {
         }
      });
    
  }

  // get all alert set by api
  getPendingAlert() {
    let getToken = this.flattradeService.getUserObjectFromLocalStorage();
      let GetPendingAlert = {
      };
      GetPendingAlert = `jData={"uid":"${getToken?.client}"}&jKey=${getToken?.token}`;
      this.httpClient.post(FlatTradeURLs.GetPendingAlert,GetPendingAlert).subscribe((GetPendingAlert: any) => {
         console.log('GetPendingAlert' , GetPendingAlert);
      });
  }
  GetEnabledAlertTypes() {
    let getToken = this.flattradeService.getUserObjectFromLocalStorage();
    let GetEnabledAlertTypes = {
    };
    GetEnabledAlertTypes = `jData={"uid":"${getToken?.client}"}&jKey=${getToken?.token}`;
    this.httpClient.post(FlatTradeURLs.GetEnabledAlertTypes, GetEnabledAlertTypes).subscribe((GetEnabledAlertTypes: any) => {
       console.log('GetEnabledAlertTypes' , GetEnabledAlertTypes);
    });
  }
  GetBrokerMsg() {
    let getToken = this.flattradeService.getUserObjectFromLocalStorage();
    let GetBrokerMsg = {
    };
    GetBrokerMsg = `jData={"uid":"${getToken?.client}"}&jKey=${getToken?.token}`;
    this.httpClient.post(FlatTradeURLs.GetBrokerMsg, GetBrokerMsg).subscribe((GetBrokerMsg: any) => {
       console.log('GetBrokerMsg' , GetBrokerMsg);
    });
  }
  checkItIsNiftyORBankNifty (myString : string) {
    if (myString.charAt(0) === "B") {
      // Action for strings starting with "B"
      console.log("String starts with 'a'");
      return 15
    } else if (myString.charAt(0) === "N") {
      // Action for strings starting with "b"
      console.log("String starts with 'N'");
      return 50;
    }
    else if (myString.charAt(0) === "F") {
      // Action for strings starting with "b"
      console.log("String starts with 'N'");
      return 40;
    }
    else if (myString.charAt(0) === "S") {
      // Action for strings starting with "b"
      console.log("String starts with 'N'");
      return 10;
    }
    else if (myString.charAt(0) === "M") {
      // Action for strings starting with "b"
      console.log("String starts with 'N'");
      return 75;
    }
    
    else {
      // Default action for other cases
      console.log("String starts with a letter other than 'a' or 'b'");
      return 0;
    }
  }
  // PLACE ORDER API
  placeOrder(tsym:any , buyprice: any ,trantype:any ) {
    let decideQty = this.checkItIsNiftyORBankNifty(tsym);
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
      "tsym":"${tsym}",
      "qty":"${decideQty}",
      "prc":"${buyprice}",
      "prd":"M",
      "trantype":"${trantype}",
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

  getRunningAlogs() 
  {
    this.supabase.getActivatedStrategyFromTable().then((e: any) => {
      if (e && e?.data.length > 0) {
        e?.data.map( ( cloneitem : any ) => {

          if (cloneitem?.s_running_status) {
             // this.startAlgo(cloneitem?.token, cloneitem?.id , cloneitem?.tsym, cloneitem?.dname)
             this.startAlgoByWebSocket(cloneitem?.token, cloneitem?.id)
        }
      })
      }
   
    });
    
  }

  findAndUpdateCollectionArray(itemToFound: any , childId: any, isRunningStatus : boolean) {
    const index = this.collectionofStrikes.findIndex(
      (item) => item.token === itemToFound
    );
    if (index !== -1 && this.collectionofStrikes[index].cloneForm) {
      let needtoUpdatedStrategyValue = this.collectionofStrikes[index].cloneForm.
         filter( ( eachStrategy : any)=> eachStrategy?.id == childId);
         if (needtoUpdatedStrategyValue && needtoUpdatedStrategyValue?.length > 0 )
         needtoUpdatedStrategyValue[0].isRunning = isRunningStatus;
    }
  }
 
  // related to websocket workaround
  
  WebSocketAuth() {
    this.depthData.messages.next(this.message);
    // this.getBankNiftySpecificStrickeRate('26009');
  }
  // get BN index values from sockets
  bankniftyTokenID: any = "26009";
  getBNValuesByDepth() {
    // this.depthData.messages.next(this.message);
    let BNObject = {
      "t": "d",
      "k": `NSE|${this.bankniftyTokenID}`
    }
    this.websocketconnection.getDataFromWS(BNObject);
  }
  getBNValuesByTouchLine() {
    // this.depthData.messages.next(this.message);
    let BNObject = {
      "t": "t",
      "k": `NSE|${this.bankniftyTokenID}`
    }
    this.websocketconnection.getDataFromWS(BNObject);
  }

   // get strike rate by web socket depth subcribe
   // by strike rate 
   getBankNiftySpecificStrickeRate(s : any) {
    let strickobject = {
      "t": "d",
      "k": `NFO|${s}`
    };
    this.websocketconnection.getDataFromWS(strickobject);
  }

  getSpecificStrickeRateTouchline(s : any) {
    // NSE|22#BSE|508123#NSE|NIFTY
    let strickobject = {
      "t": "t",
      "k": `NFO|${s}`
    };
    this.websocketconnection.getDataFromWS(strickobject);
  }


  startAlgoByWebSocket(token: any, strategy_id: number) {
     // this.WebSocketAuth();
    // this also regarding pause and play time need to handle the stop strategy id boolen value,
    // here only we set based on s_id set s to take trade by setting to false value
    const index2 = this.strategyies.findIndex(
      (item) => item.strategyid === strategy_id
    );
    if (index2 !== -1) {
       this.strategyies[index2].stopStrategyById =  false;
    }
  
     // this.webworker.startWorker();
    // 10000 == 1 sec
    this.getSpecificStrickeRateTouchline(token);
   
    console.log('new logic check start api call on parent strike click', token)
     this.strategyies.filter((strategyObject: any) => {
      if (strategyObject?.strategy_id == strategy_id) {
        strategyObject.isRunning = true;
        this.supabase.updateToStrikePrice({
          s_running_status : true,
          token: strategyObject?.strategy_id
        });
        return strategyObject;
      } else {
        return;
      }
    });
    // on play click show and hide pause or play button logic
    this.findAndUpdateCollectionArray(token , strategy_id, true)
    // this.subcribeToWebSocketResponse(strategy_id,strikename);
    this.subcribeToWebSocketResponse();
      }

      subcribeToWebSocketResponse() {
       
            const subscription  : any =  this.depthData.messages.subscribe((wsResponse: any) => {

              this.dataService.b1$.subscribe((updatedB1value : any) => {
                this.strategyies.forEach((strategyid:any) => {
                   if (strategyid.strategy_id == updatedB1value?.strategy_id ) {
                    strategyid.b1 = updatedB1value?.B1;
                    strategyid.t1 = updatedB1value?.T1;
                    strategyid.sl = updatedB1value?.SL;
                    
                   }
                })
                  });
                 
          console.log('nfo check' , wsResponse) 

          if (wsResponse) {
            if (wsResponse?.e == "NSE") {
              // BN values comes here
              console.log('BN values', wsResponse?.e);
              // this.BNValues = result;
              // this.checkBNsupport(result);
            } else if (wsResponse?.e == "NFO") {
              // strike price will come here          
              let eachstratey = this.strategyies.filter((strategyObject: any) => {
                if ( ( wsResponse?.tk && wsResponse.tk == strategyObject?.scriptid) &&
                 (strategyObject?.stopStrategyById == false ) ){
                  console.log('handle order')
                  this.handlePlaceOrder(wsResponse,
                    strategyObject);
                   // this.setBuyPriceAndCalculateTarget(strategyObject, wsResponse)
                }
              });
            } else {
              // else as per syntax
            }
          //   const subscriptionData = {
          //     subscription: subscription,
          //     strategy_id: strategy_id
          //   };
          //  this.subscriptions.push(subscriptionData);
          }
      
      
        });
      }

      
  getBackTestingData(strategyid: any) {
    console.log('cline' ,strategyid)
    const ref = this.dialogService.open(BackTestDetailComponent, {
      header: 'Back Testing Report',
      dismissableMask: true,
      width: '70%',  data: {
        strategyid: strategyid
    },
  });
  }
  
  getReportsData(strategyid: StrikeItemForUI, indexOfCollectionOfStrick : any) {
    let backTestingReport : any = [];
      this.supabase.getPriceValuesFromBacktesting(strategyid?.id).then((backTestingData: any) => {
        backTestingReport = backTestingData?.data;
        this.totalNegativeSum = 0;
        this.totalPositiveSum = 0;
        if (backTestingReport && backTestingReport.length > 0) {
          // calculate the points collected
          let entryPoint = null;
          let pointsCollected = 0;
          let positiveSum = 0;
          let negativeSum = 0;
        
          for (let i = 0; i < backTestingReport.length; i++) {
            if (backTestingReport[i].order_type) {
              entryPoint = backTestingReport[i].B1;
              pointsCollected = 0; // Reset pointsCollected for a new set
            } else if (entryPoint !== null) {
              const exitPoint = backTestingReport[i].B1;
  
              const currentPoints = exitPoint - entryPoint;
              pointsCollected += currentPoints;
              backTestingReport[i].pointsCollected = currentPoints.toFixed(2);
              
              if (currentPoints > 0) {
                positiveSum += currentPoints;
                backTestingReport[i].positiveSum = positiveSum.toFixed(2);
                backTestingReport[i].negativeSum = negativeSum.toFixed(2);
                this.totalPositiveSum += currentPoints; // Accumulate the positiveSum value
            } else {
                negativeSum += currentPoints;
                backTestingReport[i].positiveSum = positiveSum.toFixed(2);
                backTestingReport[i].negativeSum = negativeSum.toFixed(2);
                this.totalNegativeSum += currentPoints; // Accumulate the negativeSum value
            }
              entryPoint = null;
            }
            //adding each strategies positive and negative total to array
            indexOfCollectionOfStrick.cloneForm.filter((innerStrategyArray : any) => {
              if (innerStrategyArray?.id == backTestingReport[i].strategy_id){
                if ( this.totalNegativeSum !== null && this.totalNegativeSum !== undefined  ) {
                  innerStrategyArray.totalNegativeSum  = Number(this.totalNegativeSum).toFixed(2);
               }
              if (this.totalPositiveSum !== null && this.totalPositiveSum !== undefined) {
                innerStrategyArray.totalPositiveSum = Number(this.totalPositiveSum).toFixed(2);
              }
              }
            })

           
          }
          // after cloneForm array pushed with totalNegativeSum, and totalPositiveSum values 
          // we now have ability to calculate total P & L so below do that one
          this.calculateParentStrikePoints(indexOfCollectionOfStrick.cloneForm , indexOfCollectionOfStrick);
        };
      })
  }
  

  calculateParentStrikePoints ( cloneForm :any  , parentArray : any) {
    let totalPositiveSum = 0 ;
    let totalNegativeSum = 0 ;
    cloneForm.forEach((eachStrategy: any) => {
      if (!isNaN(eachStrategy.totalPositiveSum)) {
        totalPositiveSum += Number(eachStrategy.totalPositiveSum);
      }
      if (!isNaN(eachStrategy.totalNegativeSum)) {
        totalNegativeSum += Number(eachStrategy.totalNegativeSum);
      }
    });
      if ( totalNegativeSum !== null && totalNegativeSum !== undefined  ) {
        parentArray.totalNegativeSum  = Number(totalNegativeSum).toFixed(2);
          }
         if (totalPositiveSum !== null && totalPositiveSum !== undefined) {
          parentArray.totalPositiveSum = Number(totalPositiveSum).toFixed(2);
         }
         this.currentPoints();
  }
   currentPandL : any = 0;
   profit : any = 0;
   loss : any = 0;
    currentPoints() {

      this.currentPandL = 0;
      this.profit = 0 ; 
      this.loss = 0; 
      this.collectionofStrikes.forEach( (eachStrike : any) => {
        if (!isNaN(eachStrike.totalPositiveSum)) {
          this.profit += Number(eachStrike.totalPositiveSum);
        }
        if (!isNaN(eachStrike.totalNegativeSum)) {
          this.loss += Number(eachStrike.totalNegativeSum);
        }
      });
    }
    showAllData() {
      this.collectionofStrikes = [];
      this.supabase.getStrikesFromDB().then((strikes) => {
        if (strikes.data != null) {
           this.collectionofStrikes = strikes.data;
          this.collectionofStrikes.forEach((eachStrike: any) => {
            eachStrike.show_to_trade = true;
            this.getCloneValues(eachStrike);
          });
        }
      }
      );

    }
    hideAllData() {
      this.collectionofStrikes.forEach((eachStrike: any) => {
        
        eachStrike.show_to_trade = false;
      });
    }
    makeAsVisibleToCurrentTrade(martSelectedStrikeToTrade : any) {
      martSelectedStrikeToTrade.show_to_trade = true;
      this.hideandshowCollectionOfStrike(martSelectedStrikeToTrade);
    }
    // instead of delete will hide from ui , 
    removeFromStrikeList(martSelectedStrikeToTrade : any) {
      martSelectedStrikeToTrade.show_to_trade = false;
      this.hideandshowCollectionOfStrike(martSelectedStrikeToTrade);

      
    }
    hideandshowCollectionOfStrike(martSelectedStrikeToTrade : any){
      this.supabase.updateToMarketWatch(martSelectedStrikeToTrade).then((data : any) =>{
        if (data && data?.length > 0 ) {
         if (data[0].show_to_trade) {
           this.collectionofStrikes.filter( (eachStrike : any) => {
             if (eachStrike.id == data[0].id ) {
               eachStrike.show_to_trade = data[0].show_to_trade; 
             }
           })
         }
        }
     })
    }
    filterbySelectedStrike() {
      this.supabase.getStrikesFromDB().then((strikes) => {
        if (strikes.data != null) {
           this.collectionofStrikes = strikes.data.filter((i) =>{
            if (i?.show_to_trade != null && i.show_to_trade)
            return i ;
          });
          this.collectionofStrikes.map((eachStrike) =>{
            this.getCloneValues(eachStrike);
          })
         
        }
      });
    }
    reconnect(){
      this.WebSocketAuth();
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
    }

    triggeredOrNot(itemToFound: any , childId: any, triggered : boolean) {
      const index = this.collectionofStrikes.findIndex(
        (item) => item.token == itemToFound
      );
      if (index !== -1 && this.collectionofStrikes[index].cloneForm) {
        let needtoUpdatedStrategyValue = this.collectionofStrikes[index].cloneForm.
           filter( ( eachStrategy : any)=> eachStrategy?.id == childId);
           if (needtoUpdatedStrategyValue && needtoUpdatedStrategyValue?.length > 0 )
           needtoUpdatedStrategyValue[0].triggered = triggered;
      }
    }

    // writin logic for scalping defined Target values 
    // idea is if B1 is defined T1 initially B1 + 3 so T1 = 3 points 
    // then , current price is above T1 
    // dynamically define B1 and T1 
    // let backtest before implement to live 
    // removed above snippet code , it is same algo like scapling component 
    // it need to improved , 
    
  //get layout get values from charts data
  ChartResponse: any;
  getlayouts() {
    let getToken = this.flattradeService.getUserObjectFromLocalStorage();
    let SetAlert = ''

    SetAlert = `https://web.flattrade.in/NorenWClientWeb/StudyTemGetData?
user=${getToken?.client}&template=TVCHARTDATA&
jKey=${getToken?.token}`;

    this.httpClient.get(SetAlert).subscribe((ChartResponse: any) => {
      //working one below
      var ChartResParse = ChartResponse.data;
      // ChartResParse will have all the saved layouts
      this.ChartResponse = JSON.parse(ChartResParse);
      console.log('1', this.ChartResponse);
      let currentOrFutureWeek: any = [];
      if (this.collectionofStrikes)
       // now having issue with older strike 
    // older strike is no longer availble on flattrade or any server 
    // so that should be ommited before make search api
        this.collectionofStrikes.map((alreadyStrikeAddedInWatchList: any, index) => {
          const result = this.isCurrentOrFutureWeekDate(alreadyStrikeAddedInWatchList?.tsym, index);
          if (result?.futureDate) {
            currentOrFutureWeek.push(this.collectionofStrikes[result?.index]);
          }
        });
      this.searchStrikeAndAddToWatchList(currentOrFutureWeek);
    });
  }

  searchStrikeAndAddToWatchList(needtoAdd: any) {
    // Find unmatched values from array1
    const unmatchedValuesArray1 = this.ChartResponse.filter((obj1: any) => {
      // Check if obj1.name does not match any obj2.value in array2
      return !needtoAdd.some((obj2: any) => obj1.symbol === obj2.tsym);
    }).map((obj: any) => obj.symbol);

    // Find unmatched values from array2
    const unmatchedValuesArray2 = needtoAdd.filter((obj2: any) => {
      // Check if obj2.value does not match any obj1.name in array1
      return !needtoAdd.some((obj1: any) => obj2.tsym === obj1.tsym);
    }).map((obj: any) => obj.tsym);
    unmatchedValuesArray1.map((drawingItem: any) => {
      this.searchByApi(drawingItem)
    })
  }
  searchByApi(queryText: string) {
    let getToken = this.flattradeService.getUserObjectFromLocalStorage();
    let bodyOfuserDetails = {};
    const jKey = getToken?.token;
    bodyOfuserDetails = `jData={
        "uid":"${getToken?.client}",
      "stext":"${queryText}"}&jKey=${jKey}`;
    this.httpClient
      .post(FlatTradeURLs.SEARCHSCRIPS, bodyOfuserDetails)
      .subscribe((scriptsResult: any) => {
        if (scriptsResult && scriptsResult.values?.length > 0)
          // below add market table and return result from table
          this.selectedStrikeEvent(scriptsResult.values[0])
      });
  }
  getDrawingValues(strike: any) {
    if (strike && strike?.tsym) {
      let symbolToFilter = `NFO:${strike?.tsym}`;
      // here index is symbol of required strike name //
      console.log('this.ChartResponse', this.ChartResponse)

      let checknewthings = this.ChartResponse.filter((searchIndex: any) => {
        return strike?.tsym == searchIndex?.symbol;
      });
      if (checknewthings?.length > 0) {
        var contentParsed = checknewthings[0].content;

        var parseddata = JSON.parse(contentParsed);
        var contentInsideContent = parseddata.content;

        var chartsArray = JSON.parse(contentInsideContent);

        // // Filter the array based on the type property
        const filteredArray = chartsArray.charts[0].panes[0].sources.filter(
          (obj: any) => obj.type === 'LineToolHorzRay'
        );

        // Filter the array based on the symbol property
        const arrayOfObjects = filteredArray.filter((obj: any) => obj.state.symbol === symbolToFilter);

        // now have array this is points array have all values for specific strike 
        // need to sort by price level 
        // because low to high is major to create option buying 
        // Sort the array based on the "price" in the "points" array of each object
        arrayOfObjects.sort((a: any, b: any) => {
          const priceA = a.points[0].price; // Assuming there's only one point in the "points" array
          const priceB = b.points[0].price; // Assuming there's only one point in the "points" array
          return priceA - priceB;
        });

        console.log('final expected results ', arrayOfObjects);
      }

    }
  }

  // from here based on string get Date current or future week
  isCurrentOrFutureWeekDate(inputString: any, index: number): any {
    if (inputString) {
      const match = inputString.match(/\d{2}[A-Z]{3}\d{2}/);
      if (!match) {
        return false; // Return false if the pattern is not found in the input string
      }

      const extractedString = match[0];
      // console.log('extractedString' , extractedString)
      const extractedDate = new Date(`20${extractedString.slice(5, 7)}-${this.getMonthNumber(extractedString.slice(2, 5))}-${extractedString.slice(0, 2)}`);
      // console.log('123' , extractedDate)
      const currentDate = new Date();

      // Calculate the start and end dates of the current week
      const startOfWeek = this.getStartOfWeek(currentDate);
      // const endOfWeek = this.getEndOfWeek(currentDate);

      // Calculate the start date of the next week
      const startOfNextWeek = new Date(startOfWeek);
      startOfNextWeek.setDate(startOfWeek.getDate() + 7);
      // console.log('startOfWeek' , startOfWeek)
      // Check if the extracted date falls within the current week or any future week
      // return extractedDate >= startOfWeek && extractedDate <= startOfNextWeek;
      return {
        futureDate: extractedDate >= startOfWeek,
        index: index
      }

    }
  }

  // Function to convert month abbreviation to month number
  getMonthNumber(monthAbbr: any) {
    const months: any = {
      JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
      JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12'
    };
    return months[monthAbbr];
  }

  // Function to get the start of the week (Sunday) for a given date
  getStartOfWeek(date: any) {
    const dayOfWeek = date.getDay();
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  }

  // Function to get the end of the week (Saturday) for a given date
  getEndOfWeek(date: any) {
    const dayOfWeek = date.getDay();
    const endOfWeek = new Date(date);
    endOfWeek.setDate(date.getDate() + (6 - dayOfWeek));
    endOfWeek.setHours(23, 59, 59, 999);
    return endOfWeek;
  }

    }
  

