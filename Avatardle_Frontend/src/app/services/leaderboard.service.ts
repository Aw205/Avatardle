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

export interface BlitzLeaderboardRecord{
  username: string,
  score: number,
  streak: number,
  time: string,
  element: string
}

@Service()
export class LeaderboardService {

  private as: AuthService = inject(AuthService);
  private http: HttpClient = inject(HttpClient);

  constructor() { }

  getLeaderboard(mode: string) {
    return this.http.get<LeaderboardRecord[]>(`${environment.apiUrl}/leaderboard`, {
      params: {
        mode: mode
      }
    });
  }

  getBlitzLeaderboard(mode: string) {
    return this.http.get<BlitzLeaderboardRecord[]>(`${environment.apiUrl}/leaderboard/blitz`, {
      params: {
        mode: mode
      }
    });
  }

  updateBlitzLeaderboard(username: string, mode: string, score: number, streak: number) {

    const record = { username, mode, score, streak };
    return this.as.getMe().pipe(
      switchMap((data) => {
        return this.http.post(`${environment.apiUrl}/leaderboard/blitz`, { ...record, element: data.element });
      }),
      catchError(() => {
        return this.http.post(`${environment.apiUrl}/leaderboard/blitz`, { ...record, element: null });
      })
    );
  }

  updateLeaderboard(username: string, mode: string, guesses: string[]) {

    const record = { username, mode, guesses };
    return this.as.getMe().pipe(
      switchMap((data) => {
        return this.http.post(`${environment.apiUrl}/leaderboard`, { ...record, element: data.element });
      }),
      catchError(() => {
        return this.http.post(`${environment.apiUrl}/leaderboard`, { ...record, element: null });
      })
    );
  }
}
