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
        this.isLoggedIn.set(true);
        this.user = data.username;
      },
      error: (err) => {
        
      }
    });
  }

  signup(username: string, password: string) {
    return this.http.post(`${environment.apiUrl}/auth/signup`, { username: username, password: password });
  }

  discordSignup(username: string, discord_id: string) {
    return this.http.post(`${environment.apiUrl}/auth/discord/signup`, { username, discord_id }, { withCredentials: true });
  }

  login(username: string, password: string) {
    return this.http.post(`${environment.apiUrl}/auth/login`, { username, password }, { withCredentials: true });
  }

  logout() {
    this.http.post(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true }).subscribe((data) => {
      this.isLoggedIn.set(false);
      this.router.navigateByUrl('/');
    });
  }

  getMe() {
    return this.http.get<any>(`${environment.apiUrl}/auth/me`, { withCredentials: true });
  }

}
