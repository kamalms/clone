import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';
@Pipe({
  name: 'customDateFormat'
})
export class CustomDateFormatPipe implements PipeTransform {

  transform(value: string): string {
    const date = new Date(value);
    const datePipe = new DatePipe('en-US');

    const formattedDate = datePipe.transform(date, 'MMM dd, yyyy');
    const formattedTime = datePipe.transform(date, 'hh:mm');

    return `${formattedDate} ${formattedTime}`;
  }

}
