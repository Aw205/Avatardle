import { inject, Service } from '@angular/core';
import { catchError, switchMap } from 'rxjs';
import { AuthService } from './auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface LeaderboardRecord {
  username: string,
  guesses: string[],
  time: string,
  element: string
}

@Service()
export class LeaderboardService {

  private as: AuthService = inject(AuthService);
  constructor(private http: HttpClient) { }

  getLeaderboard() {

    return this.http.get<LeaderboardRecord[]>(`${environment.apiUrl}/leaderboard`);
  }

  updateLeaderboard(username: string, guesses: string[]) {

    return this.as.getMe().pipe(
      switchMap((data) => {
        return this.http.post(`${environment.apiUrl}/leaderboard`, {
          username: username,
          guesses: guesses,
          element: data.element
        });
      }),
      catchError(() => {
        return this.http.post(`${environment.apiUrl}/leaderboard`, {
          username: username,
          guesses: guesses,
          element: null
        });
      })
    );
  }
}
