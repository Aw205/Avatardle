
import confetti from 'canvas-confetti';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { interval, Observable, shareReplay, startWith, Subject, switchMap, timer } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Episode {
  [key: string]: number;
}
export interface Transcript {

  Character: string,
  script: string,
  episodeNum: number,
  bookNum: number,
  total_number: number
}

export interface Character {

  gender: string,
  nationality: string,
  bendingElement: string,
  affiliations: string[],
  firstAppearance: string,
  name: string,
  index: number
}

export interface CharacterFilter {
  classic: { [key: string]: string[] },
  quote: string[]
}

export interface DailyStats {

  classic_completion: number,
  quote_completion: number,
  picture_completion: number,
  music_completion: number
}

export interface LeaderboardRecord {

  username: string,
  guesses: string[],
  time: string,
}

export interface FanArt {

  character: string,
  images: { pathName: string, artist: { name: string, link: string }, epithet: string }[]

}

export interface Ost {
  name: string,
  audio: string,
  book: number,
  episode: number,
  link: string,
  characters: string[],
  numScenes: number,
  timestamps: string[]
}

@Injectable({
  providedIn: 'root'
})

export class DataService {

  characterData!: Character[];
  characterFilter!: CharacterFilter;

  transcript!: Transcript[];
  quoteIndices!: { [key: string]: number[] };
  dailyStats!: DailyStats;
  fanArt!: FanArt[];

  episodes!: string[];
  pictureData$!: Observable<Episode>;
  stats$!: Observable<DailyStats>;
  con$!: Observable<any>;
  transcript$!: Observable<Transcript[]>;
  osts$!: Observable<Ost[]>;
  leaderboard$!: Observable<LeaderboardRecord[]>;
  pageNotFound$: Subject<boolean> = new Subject<boolean>();

  constructor(private http: HttpClient) { }


  initialize(): Observable<Character[]> {

    if (environment.production) {
      this.stats$ = interval(120000).pipe(
        startWith(0),
        switchMap(() => this.http.get<DailyStats>(`${environment.statsApiUrl}/getStats`))
      );
    }

    let ob = this.http.get<Character[]>('json/characters.json');
    ob.subscribe((data) => {
      this.characterData = data;
    });
    this.http.get<CharacterFilter>('json/characterFilters.json').subscribe((data) => {
      this.characterFilter = data;
    });
    this.http.get<string[]>('json/episode.json').subscribe((data) => {
      this.episodes = data;
    });
    this.http.get<{ [key: string]: number[] }>('json/quote_indices.json').subscribe((data) => {
      this.quoteIndices = data;
    });
    this.http.get<FanArt[]>('json/fanart.json').subscribe((data) => {
      this.fanArt = data;
    });

    this.transcript$ = this.http.get<Transcript[]>('json/full_transcript.json').pipe(shareReplay(1));
    this.pictureData$ = this.http.get<Episode>('json/episodes.json').pipe(shareReplay(1));
    this.con$ = this.http.get<any>('json/particleConfigs.json').pipe(shareReplay(1));
    this.osts$ = this.http.get<Ost[]>('json/osts.json').pipe(shareReplay(1));
    this.leaderboard$ = timer(0, 50000).pipe(
      switchMap(() => this.http.get<LeaderboardRecord[]>(`${environment.statsApiUrl}/getLeaderboard`)),
      shareReplay({ bufferSize: 1, refCount: true })
    );
    return ob;
  }


  getClassicCharacterData(series: string[]): Character[] {

    let filter: string[] = [];
    for (let s of series) {
      filter.push(...this.characterFilter.classic[s]);
    }
    return this.characterData.filter(char => filter.includes(char.name));
  }

  getQuoteCharacterData(): string[] {

    return [...this.characterFilter.quote];
  }

  updateStats(mode: string) {

    this.http.patch(`${environment.statsApiUrl}/updateStats`, { type: "daily", mode: mode }).subscribe(data => { });
  }

  updateLeaderboard(username: string, guesses: string[], time: string) {

    return this.http.patch(`${environment.statsApiUrl}/updateLeaderboard`, { username: username, guesses: guesses, time: time });
  }

  getCountdownConfig() {

    let tom = new Date();
    tom.setUTCDate(tom.getUTCDate() + 1);
    tom.setUTCHours(0, 0, 0, 0);
    return { leftTime: Math.floor((tom.getTime() - Date.now()) / 1000) };

  }

  throwConfetti(numGuesses: number) {

    var end = Date.now() + 1000;
    var colors = (numGuesses == 1) ? ['#a67c00', '#bf9b30', '#ffbf00', '#ffcf40'] : ['#e74c3c', '#f2f4f4', '#3498db', '#196f3d'];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());

  }
}
