import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private router = inject(Router);
  isLoggedIn: WritableSignal<boolean> = signal(false);
  user: string = "";

  constructor(private http: HttpClient) { }


  initialize() {

    this.getMe().subscribe({
      next: (data) => {
        console.log("here in next")
        if (data) {
          this.isLoggedIn.set(true);
          this.user = data.username;
        }
      },
      error: (err) => {
        console.log("here in error")
      }
    });
  }

  signup(username: string, password: string) {
    return this.http.post(`${environment.statsApiUrl}/signup`, { username: username, password: password });
  }

  login(username: string, password: string) {
    return this.http.post(`${environment.statsApiUrl}/login`, { username, password }, { withCredentials: true });
  }

  logout() {
    this.http.post(`${environment.statsApiUrl}/logout`, {}, { withCredentials: true }).subscribe((data) => {
      this.isLoggedIn.set(false);
      this.router.navigateByUrl('/');
    });
  }

  getMe() {
    return this.http.get<any>(`${environment.statsApiUrl}/me`, { withCredentials: true });
  }

}
