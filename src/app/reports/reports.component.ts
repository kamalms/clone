import { DatasharedService } from './../datashared.service';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Chart } from 'chart.js';
import { SupabaseService } from '../supabase.service';


@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit {

  basicOptions: any;
  basicData: any;
  // input of component
  @Input()
  strike : any;
  @ViewChild('chartcore') chart! : Chart;

  constructor(private dataService : DatasharedService, private readonly supabase: SupabaseService) { }

  ngOnInit(): void {
    this.basicData = {
      labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
      datasets: [
          {
              label: 'My First dataset',
              backgroundColor: '#42A5F5',
              data: [65, 59, 80, 81, 56, 55, 40]
          },
          {
              label: 'My Second dataset',
              backgroundColor: '#FFA726',
              data: [28, 48, 40, 19, 86, 27, 90]
          }
      ]
  };
    this.dataService.strikeDetailasshared$.subscribe((selectedStrike) =>{
console.log(selectedStrike);
this.getSpecificBackingTestingDataByStrategyID(selectedStrike);
    })
  }
  getSpecificBackingTestingDataByStrategyID(strategyId : any) {
    this.supabase.getPriceValuesFromPriceTableByID(strategyId?.id).then((strategiesDetail : any) => {
      console.log(strategiesDetail)
      this.supabase.getPriceValuesFromBacktesting(strategiesDetail?.data[0]?.id).then((backTestingData : any) =>{
        console.log('back tested reports' , backTestingData)
      })
    })
  }
}
