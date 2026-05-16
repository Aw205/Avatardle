import { ChangeDetectionStrategy, Component, inject, input, WritableSignal } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormBuilder, FormGroup, FormsModule, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { TranslatePipe } from "@ngx-translate/core";
import { AuthService } from '../services/auth.service';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthDialogComponent } from '../auth-dialog/auth-dialog.component';

@Component({
  selector: 'app-login',
  imports: [MatInputModule, MatFormFieldModule, FormsModule, TranslatePipe, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {

  loginForm: FormGroup;
  auth: AuthService = inject(AuthService);
  hidePassword: boolean = true;
  parentIndexSignal = input.required<WritableSignal<number>>();

  constructor(public http: HttpClient, private fb: FormBuilder, private dialogRef: MatDialogRef<AuthDialogComponent>) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {

      this.auth.login(this.loginForm.value.username, this.loginForm.value.password).subscribe({
        next: (res) => {
          this.auth.user = this.loginForm.value.username;
          this.auth.isLoggedIn.set(true);
          this.dialogRef.close();
        },
        error: (res) => {
          this.loginForm.get("password")?.setErrors({ invalidCredentials: true });
        }
      });

    }
  }

}
