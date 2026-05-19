import { Component, inject, signal, WritableSignal } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormBuilder, FormGroup, FormsModule, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { TranslatePipe } from "@ngx-translate/core";
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../services/auth.service';
import { ActivatedRoute } from '@angular/router';
@Component({
  selector: 'app-complete-profile',
  imports: [MatInputModule, MatFormFieldModule, FormsModule, TranslatePipe, ReactiveFormsModule],
  templateUrl: './complete-profile.component.html',
  styleUrl: './complete-profile.component.css'
})
export class CompleteProfileComponent {

  private snackBar = inject(MatSnackBar);
  auth: AuthService = inject(AuthService);
  private route = inject(ActivatedRoute);
  signUpForm: FormGroup;
  discordUsername: WritableSignal<string> = signal('');
  discordAvatar: WritableSignal<string> = signal('');
  discordId: WritableSignal<string> = signal('');

  constructor(public http: HttpClient, private fb: FormBuilder) {
    this.signUpForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20), Validators.pattern(/^[a-zA-Z0-9_-]*$/)]]
    });
  }

  ngOnInit() {
    this.discordUsername.set(this.route.snapshot.queryParamMap.get('username')!);
    let discordId = this.route.snapshot.queryParamMap.get('id');
    this.discordId.set(discordId!);
    let avatarHash = this.route.snapshot.queryParamMap.get('avatar');
    if (avatarHash == 'null') {
      const index = Number((BigInt(discordId!) >> 22n) % 6n);
      this.discordAvatar.set(`https://cdn.discordapp.com/embed/avatars/${index}.png`)
    }
    else {
      this.discordAvatar.set(`https://cdn.discordapp.com/avatars/${discordId}/${avatarHash}.webp`);
    }
  }

  onSubmit() {

    if (this.signUpForm.valid) {
      this.auth.discordSignup(this.signUpForm.value.username, this.discordId()).subscribe({
        next: (data) => {
          this.snackBar.open("Account created", undefined, { panelClass: "snack-bar", duration: 4000 });
          this.auth.isLoggedIn.set(true);
          this.auth.user = this.signUpForm.value.username;
        },
        error: (err: HttpErrorResponse) => {
          if (err.status == 409) {
            if (err.error.constraint == 'users_unique') {
              return this.signUpForm.get("username")?.setErrors({ discordIdTaken: true });
            }
            this.signUpForm.get("username")?.setErrors({ usernameTaken: true });
          }
        }
      });

    }
  }
}








