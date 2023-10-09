import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { AuthComponent } from './auth/auth.component';
import { AccountComponent } from './account/account.component';
import { ReactiveFormsModule } from '@angular/forms';
import { AvatarComponent } from './avatar/avatar.component';
import { ButtonModule } from 'primeng/button';
// import { LoginComponent } from './login/login.component';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { HomeComponent } from './home/home.component';
import { TableModule } from 'primeng/table';
import { MultiSelectModule } from 'primeng/multiselect';
import { DropdownModule } from 'primeng/dropdown';
import { HttpClientModule } from '@angular/common/http';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { DynamicDialogModule } from 'primeng/dynamicdialog';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule, Routes } from '@angular/router';
import { CalendarModule } from 'primeng/calendar';
import { SkeletonModule } from 'primeng/skeleton';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { ReportsComponent } from './reports/reports.component';
// import { BnlevelsComponent } from './bnlevels/bnlevels.component';
import { MatTabsModule } from '@angular/material/tabs';
import { ChartModule } from 'primeng/chart';
import { LoginComponent } from './login/login.component';
import {ProgressBarModule} from 'primeng/progressbar';
const routes: Routes = [
  { path: 'backtestreports', component: ReportsComponent },
  // { path: 'bnlevels', component: BnlevelsComponent },
  { path: '', redirectTo: '/', pathMatch: 'full' },
];
@NgModule({
  declarations: [
    AppComponent,
    AuthComponent,
    AccountComponent,
    AvatarComponent,
  //  LoginComponent,
    HomeComponent,
    ReportsComponent,
    LoginComponent,
    // BnlevelsComponent,
  ],
  imports: [
    // RouterModule.forRoot(routes),
    BrowserModule,
    InputTextModule,
    CalendarModule,
    ToastModule,
    MatTabsModule,
    ChartModule,
    MultiSelectModule,
    DropdownModule,
    AutoCompleteModule,
    ProgressSpinnerModule,
    BrowserAnimationsModule,
    InputNumberModule,
    SkeletonModule,
    HttpClientModule,
    DynamicDialogModule,
    CheckboxModule,
    DialogModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forRoot(routes),
    TableModule,
    ButtonModule,
    DropdownModule,
    ProgressBarModule
  ],
  providers: [],
  bootstrap: [AppComponent],
  exports: [RouterModule],
})
export class AppModule {}
