import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../supabase.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  userid! : string;
  constructor(private supabaseservice : SupabaseService) { }

  ngOnInit(): void {
    this.userid = "admin123"
  }
  login() {
    this.supabaseservice.login(this.userid)
  }

}
