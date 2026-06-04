import { Component, inject, input, WritableSignal } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormBuilder, FormGroup, FormsModule, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { TranslatePipe } from "@ngx-translate/core";
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-signup',
  imports: [MatInputModule, MatFormFieldModule, FormsModule, TranslatePipe, ReactiveFormsModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent {

  private snackBar = inject(MatSnackBar);
  auth: AuthService = inject(AuthService);
  signUpForm: FormGroup;
  hidePassword: boolean = false;

  parentIndexSignal = input.required<WritableSignal<number>>();

  constructor(public http: HttpClient, private fb: FormBuilder) {

    this.signUpForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20), Validators.pattern(/^[a-zA-Z0-9_-]*$/)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]]
    });

  }

  onSubmit() {
    if (this.signUpForm.valid) {
      this.auth.signup(this.signUpForm.value.username, this.signUpForm.value.password).subscribe({
        next: (data) => {
          this.snackBar.open("Account created", undefined, { panelClass: "snack-bar", duration: 4000 });
          this.signUpForm.reset();
          this.parentIndexSignal().set(1)

        },
        error: (err: HttpErrorResponse) => {
          if (err.status == 409) {
            this.signUpForm.get("username")?.setErrors({ usernameTaken: true });
          }
        }
      });

    }
  }




}
