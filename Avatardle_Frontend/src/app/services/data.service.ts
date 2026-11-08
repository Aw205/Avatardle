
import confetti from 'canvas-confetti';
import { inject, PLATFORM_ID, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, forkJoin, map, Observable, of, shareReplay, Subject, switchMap, tap, timer } from 'rxjs';
import { environment } from '../../environments/environment';
import { isPlatformBrowser } from '@angular/common';

export interface CharacterInscription {
  inscription: string;
  inscriptionEnglish: string;
}

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


@Service()
export class DataService {

  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  characterData!: Character[];
  characterFilter!: CharacterFilter;

  quoteIndices!: { [key: string]: number[] };
  fanArt!: FanArt[];

  episodes!: string[];
  pictureData$!: Observable<Episode>;
  stats$: Observable<DailyStats | null> = of(null);
  con$!: Observable<any>;
  transcript$!: Observable<Transcript[]>;
  osts$!: Observable<Ost[]>;
  readonly characterInscriptions$: Observable<Record<string, CharacterInscription>> = this.http
    .get<Record<string, CharacterInscription>>('json/character-inscriptions.json').pipe(
      catchError(() => of({})),
      shareReplay({ bufferSize: 1, refCount: true })
    );

  pageNotFound$: Subject<boolean> = new Subject<boolean>();


  initialize(): Observable<Character[]> {

    if (environment.production) {
      if (isPlatformBrowser(this.platformId)) {
        this.stats$ = timer(0, 60000).pipe(
          switchMap(() => this.http.get<DailyStats>(`${environment.apiUrl}/stats`)),
          shareReplay({ bufferSize: 1, refCount: true })
        );
      } else {
        this.stats$ = of(null);
      }
    }

    this.transcript$ = this.http.get<Transcript[]>('json/full_transcript.json').pipe(shareReplay(1));
    this.pictureData$ = this.http.get<Episode>('json/episodes.json').pipe(shareReplay(1));
    this.con$ = this.http.get<any>('json/particleConfigs.json').pipe(shareReplay(1));
    this.osts$ = this.http.get<Ost[]>('json/osts.json').pipe(shareReplay(1));

    // Resolve all eagerly used data before routing; each asset is fetched once.
    return forkJoin({
      characters: this.http.get<Character[]>('json/characters.json'),
      filters: this.http.get<CharacterFilter>('json/characterFilters.json'),
      episodes: this.http.get<string[]>('json/episode.json'),
      quoteIndices: this.http.get<Record<string, number[]>>('json/quote_indices.json'),
      fanArt: this.http.get<FanArt[]>('json/fanart.json')
    }).pipe(
      tap(data => {
        this.characterData = data.characters;
        this.characterFilter = data.filters;
        this.episodes = data.episodes;
        this.quoteIndices = data.quoteIndices;
        this.fanArt = data.fanArt;
      }),
      map(data => data.characters)
    );
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
    this.http.patch(`${environment.apiUrl}/stats`, { type: "daily", mode: mode }).subscribe();
  }

  getDiscoveredCharacters() {
    return this.http.get<{ character_id: number }[]>(`${environment.apiUrl}/discovered-characters`, { withCredentials: true });
  }

  getDiscoveredCharactersCount(username: string) {
    return this.http.get<{ count: string | number }>(`${environment.apiUrl}/users/${encodeURIComponent(username)}/discovered-characters`);
  }

  updateDiscoveredCharacters(name: string) {

    this.http.patch(`${environment.apiUrl}/discovered-characters`, { name }, { withCredentials: true }).subscribe();
  }

  updateProfile(bio: string, element: string, favorite_characters: string[], favorite_ship: string[]) {

    return this.http.patch(`${environment.apiUrl}/updateProfile`, { bio, element, favorite_characters, favorite_ship }, { withCredentials: true });
  }

  getUserProfile(username: string) {
    return this.http.get<any>(`${environment.apiUrl}/users/${encodeURIComponent(username)}`);
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
