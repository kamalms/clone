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
interface AutoCompleteCompleteEvent {
  originalEvent: Event;
  query: string;
}
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  providers: [CustomerService, HttpClient, MessageService],
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

  eachchildvalue: any[] = [];
  algoinitiaedTokens: any[] = [];
  cities!: any[];
  selectedCity: any;

  constructor(
    private dataService: DatasharedService,
    private elementRef: ElementRef,
    private router: Router,
    private messageService: MessageService,
    private readonly supabase: SupabaseService,
    private customerService: CustomerService,
    private httpClient: HttpClient,
    private flattradeService: CommonService,
    private primengConfig: PrimeNGConfig
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
    console.log(event);
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
      console.log('customers', customers);
      if (customers.data != null) this.collectionofStrikes = customers.data;
      this.collectionofStrikes.map((strike: any) => {
        this.getCloneValues(strike);
      });
      this.loading = false;
      console.log(this.collectionofStrikes);
    });
    this.primengConfig.ripple = true;

    // this.priceLevelsForm?.get('rangeDates')?.valueChanges.subscribe((value: any) => {
    //   console.log('Selected Date Range:', value);
    //   this.rangeofDates = [];
    //   this.formatDateAsRequired(value)
    // });
  }

  // algo init
  // auto complete search event trigger
  // once event triggered , directly inserted in market feed table
  async selectedStrikeEvent(e: any) {
    console.log(e);
    // insert into market watch table
    this.supabase.insertMarketWatch(e).then((e: any) => {
      console.log('inserted ', e);
      if (e?.data) this.collectionofStrikes.push(e?.data[0]);
    });
  }

  // main form entry
  setTarget(strike: any) {
    console.log('rangeofDates', strike);
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

  getCloneValues(strike: any) {
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

              });
            });
            // cloneForm is array created for child ptable list
            this.collectionofStrikes[index].cloneForm = cloneItemsofArray;

            this.showSuccess('info', 'Success', 'Strategy Added');
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
        .getPriceValuesFromPriceTablebyID(this.selectedStrikeLevel?.id)
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
    console.log('get reporst', cloneitem);

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
    "intrv":"15"}&jKey=${getToken?.token}`;
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
  startAlgo(token: any, strategy_id: number) {
    const apiInterval = 30000; // 40 seconds in milliseconds
    console.log('new logic check start api call on parent strike click', token)

    this.parentStrikeInterval$ = interval(apiInterval).pipe(
      share(), // Use the share operator to make the observable shared
      switchMap(() =>
           this.getStrikeDataByChart(token)

         //this.customerService.get43800CEdata(token)
      )
    );
    if (this.parentStrikeInterval$) {
      let currentIndex = 0;
      this.parentStrikeInterval$.subscribe((data: any) => {
        // let reverseArrayOrder = data?.scriptData.reverse();
       // let reverseArrayOrder = data?.reverse();
      //   console.log('Next: ', reverseArrayOrder);
        // this.eachchildvalue.filter((strategyid: any) => {
        // now again we don't need to filter on array now we have stragety id which
        //  values only need to checked with response price  strategy_id
      //  console.log('on real check' , this.eachchildvalue);
        this.dataService.b1$.subscribe((updatedB1value : any) => {
            this.eachchildvalue.forEach((strategyid:any) => {
               if (strategyid.strategy_id == updatedB1value?.strategy_id ) {
                strategyid.b1 = updatedB1value?.B1;
                strategyid.t1 = updatedB1value?.T1;
                strategyid.sl = updatedB1value?.SL;
                
               }
            })
              });

        let eachstratey = this.eachchildvalue.filter((strategyObject: any) => {
          if (strategyObject?.strategy_id == strategy_id) {
            return strategyObject;
          } else {
            return;
          }
        });
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
      // let objectdata = getValueEveryMinute(THIS);
        let objectdata = data[0];
        console.log('objectdata', objectdata)
        this.handlePlaceOrder(objectdata,
          eachstratey[0] , token);
      }
      );
    }
  }
  ArrayofObject: any[] = [];
  handlePlaceOrder(object: any, strageryFormValues: any , strikeUniqueid : number) {
    let B1 = strageryFormValues?.b1;
    let T1 = strageryFormValues?.t1;
    let SL = parseFloat(strageryFormValues?.sl);
    let strateguniqueid = strageryFormValues?.strategyid;
    let openPrice = object?.into;
    let closePrice = parseFloat(object?.intc);
    let highPrice = parseFloat(object?.inth);
    let lowPrice = object?.intl;
    // reveresedchidlforms.forEach((i: any) => {
    if (!strageryFormValues.buytriggered) {

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
          });
          this.setDynamicAlert(`${strikeUniqueid} buying call` ,strikeUniqueid, closePrice);
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

            // dynamic alert set 
            this.setDynamicAlert(`${strikeUniqueid} selling call alert` ,strikeUniqueid, highPrice);
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

            // SL trigger alert 
            this.setDynamicAlert(`${strikeUniqueid} SL call alert` ,strikeUniqueid, highPrice);
            }
          
        }
        
      }
    }
  }
  dynamicArrays: any[] = [];
  initAlgoRealTime(price: any) {

    // get strategy form values from table
    this.supabase
      .getPriceValuesFromPriceTableByID(price?.id ? price?.id : price)
      .then((tokenValues: any) => {
        if (tokenValues?.data?.length != 0) {
          let B1 = tokenValues?.data[0]?.B1;
          let T1 = tokenValues?.data[0]?.T1;
          console.log('updated t 1 ' , T1)
          let SL = tokenValues?.data[0]?.SL;
          let startdate = tokenValues?.data[0]?.start_date;
          let enddate = tokenValues?.data[0]?.end_date;
          let token = tokenValues?.data[0]?.token;
          let id = tokenValues?.data[0]?.id;
          let serverSide_B1_trigger_value = tokenValues?.data[0]?.buytriggered;
          let serverSide_T1_trigger_value = tokenValues?.data[0]?.selltriggered;
          let serverSide_SL_trigger_value = tokenValues?.data[0]?.sltriggered;
          // this.getChartDataByMin(price, startdate, enddate, B1, T1);
          let pricelevelobject = {
            strategyid: price.id,
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
            // b1serervalue : serverSide_B1_trigger_value
          }
          // const newArray: any[] = [pricelevelobject]; // Create a new empty array
          // this.dynamicArrays.push(newArray);
          this.eachchildvalue?.push(pricelevelobject);
          console.log('on push check main arrrya ' , this.eachchildvalue)
          this.dataService.updateB1(pricelevelobject);
        }
      });
  }
  parentStrikeInterval$: any;

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
  pauseAlgo(token: string) {
    // this.pause = true;
    this.chartDataInterval$.unsubscribe();
    this.showSuccess('success', 'success', 'Algo Stopped');
  }

  setDynamicAlert(BuyingStrike : string , tsym : any, priceToBuy : any) {
    console.log('here buy and sell values' )
    
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
         // this.placeOrder()
         }
      });
    
  }
}
