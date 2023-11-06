import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../supabase.service';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-back-test-detail',
  templateUrl: './back-test-detail.component.html',
  styleUrls: ['./back-test-detail.component.css']
})
export class BackTestDetailComponent implements OnInit {
  backTestingReport : any;
  verified : string = '';
  totalNegativeSum : any = 0;
  totalPositiveSum: any = 0;
  constructor( private readonly supabase: SupabaseService, public config: DynamicDialogConfig, public ref: DynamicDialogRef) { 
    this.ref.onClose.subscribe((data) => {
      let dataFromForm = {
        order_id : this.config.data?.strategyid?.id,
        verified : this.verified
      }
      this.supabase.insertVerificationData(dataFromForm).then((d : any) => {
        console.log('d' , d )
      })
      // Add your logic here to handle data before closing the dialog
    });
  }

  ngOnInit(): void {
     //id: this.config.id
    this.getBackTestingData(this.config.data?.strategyid);
    this.getVerificationDataById();
  }

  getBackTestingData(strategyid: any) {
    this.totalNegativeSum = 0;
    this.totalPositiveSum = 0;
    this.supabase.getPriceValuesFromBacktesting(strategyid?.id).then((backTestingData: any) => {
      this.backTestingReport = backTestingData?.data;
      if (this.backTestingReport && this.backTestingReport.length > 0) {
        // calculate the points collected
        let entryPoint = null;
        let pointsCollected = 0;
        let positiveSum = 0;
        let negativeSum = 0;
      
        for (let i = 0; i < this.backTestingReport.length; i++) {
          if (this.backTestingReport[i].order_type) {
            entryPoint = this.backTestingReport[i].B1;
            pointsCollected = 0; // Reset pointsCollected for a new set
          } else if (entryPoint !== null) {
            const exitPoint = this.backTestingReport[i].B1;

            const currentPoints = exitPoint - entryPoint;
            pointsCollected += currentPoints;

           // pointsCollected += exitPoint - entryPoint;
            this.backTestingReport[i].pointsCollected = currentPoints.toFixed(2);
            
            if (currentPoints > 0) {
              positiveSum += currentPoints;
              this.backTestingReport[i].positiveSum = positiveSum.toFixed(2);
              this.backTestingReport[i].negativeSum = negativeSum.toFixed(2);
              this.totalPositiveSum += currentPoints; // Accumulate the positiveSum value
          } else {
              negativeSum += currentPoints;
              this.backTestingReport[i].positiveSum = positiveSum.toFixed(2);
              this.backTestingReport[i].negativeSum = negativeSum.toFixed(2);
              this.totalNegativeSum += currentPoints; // Accumulate the negativeSum value
          }
            entryPoint = null;
          }
        }
        if (this.totalNegativeSum ) {
          this.totalNegativeSum = this.totalNegativeSum?.toFixed(2);
        }
       if (this.totalPositiveSum) {
        this.totalPositiveSum = this.totalPositiveSum?.toFixed(2);
       }
       
        console.log("Total negativeSum:", this.totalNegativeSum );
      };

      // now this.backTestingReport have pointsCollected value 
      console.log('this backtesting data' , this.backTestingReport)
    })
  }
  getVerificationDataById() {
    this.supabase.getPriceValuesFromPriceTableByID(this.config.data?.strategyid?.id)
    .then((d : any) => {
      console.log('d' , d )
      this.verified = d.data[0].verified;
    })
  }
  
}
