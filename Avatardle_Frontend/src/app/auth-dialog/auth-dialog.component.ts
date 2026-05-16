import { Component, signal, WritableSignal } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { SignupComponent } from '../signup/signup.component';
import { LoginComponent } from '../login/login.component';
import { TranslatePipe } from '@ngx-translate/core';
import {
  MatDialogContent,
  MatDialogRef,
} from '@angular/material/dialog';

@Component({
  selector: 'app-auth-dialog',
  imports: [MatTabsModule, SignupComponent, LoginComponent, MatDialogContent, TranslatePipe],
  templateUrl: './auth-dialog.component.html',
  styleUrl: './auth-dialog.component.css'
})
export class AuthDialogComponent {

  activeTabIndex = signal(0);
  constructor(public dialogRef: MatDialogRef<AuthDialogComponent>) { }

}
