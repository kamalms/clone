import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-bn-sr-level',
  templateUrl: './bn-sr-level.component.html',
  styleUrls: ['./bn-sr-level.component.scss']
})
export class BnSRLevelComponent implements OnInit {
  s1! : number ;
  s2! : number ;
  s3! : number ;
  r1! : number ;
  r2! : number ;
  r3! : number ;
  saveRandS() {
  console.log(this.r1);

  let supportandresistance = {
    s1 : this.s1,
    s2: this.s2,
    s3:this.s3,
    r1:this.r1,
    r2:this.r2,
    r3:this.r3
  }
  localStorage.setItem('supportandresistance', JSON.stringify(supportandresistance))
  }

  getUserObjectFromLocalStorage () {
   return JSON.parse(localStorage.getItem('supportandresistance') || '{}')
  }

  clearSupportAndResistance () {
    localStorage.removeItem('supportandresistance')
  }
  ngOnInit() {
    let sp = this.getUserObjectFromLocalStorage();
      if ( sp ) {
        this.s1 = sp?.s1;
        this.s2 = sp?.s2;
        this.s3 = sp?.s3;

        // resistance set

        this.r1 = sp?.r1;
        this.r2 = sp?.r2;
        this.r3 = sp?.r3;
      }
  }
}
