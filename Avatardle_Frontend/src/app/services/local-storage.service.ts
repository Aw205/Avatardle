import { afterNextRender, effect, inject, Injectable, signal, WritableSignal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { tileData } from '../tile/tile.component';

export interface AvatardleProgress {
  date: string,
  version: string,
  classic: { complete: boolean, guesses: tileData[], series: string[] },
  quote: { complete: boolean, numGuesses: number },
  picture: { complete: boolean, numGuesses: number },
  particleSettings: { enable: boolean },
  language: string | undefined
}

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  VERSION: string = "1.2.3";
  currentDate = new Date().toLocaleDateString("en-US", { timeZone: "UTC" });
  progress: WritableSignal<AvatardleProgress>;
  default: AvatardleProgress = {
    date: this.currentDate,
    version: this.VERSION,
    classic: { complete: false, guesses: [], series: ["ATLA-title"] },
    quote: { complete: false, numGuesses: 0 },
    picture: { complete: false, numGuesses: 0 },
    particleSettings: {
      enable: true
    },
    language: undefined
  };
  
  isBrowser: boolean = (typeof window != "undefined");

  constructor() {
    let ts = inject(TranslateService);
    this.progress = signal(this.default);

    if(this.isBrowser){
      if (localStorage.getItem("avatardle_progress") != null) {
        try {
          this.progress.set(JSON.parse(localStorage.getItem("avatardle_progress")!));
          if (this.currentDate != this.progress().date || this.VERSION != this.progress().version) {
            this.default.language = this.progress().language;
            this.default.classic.series = this.progress().classic.series ?? ["ATLA-title"];
            this.progress.set(this.default);
          }
        }
        catch (e) {
          console.error(e);
          this.progress.set(this.default);
        }
      }
      ts.use(this.progress()?.language ?? navigator.language.split("-")[0]);
      effect(() => {
        localStorage.setItem("avatardle_progress", JSON.stringify(this.progress()));
      });
    }
  }

  patch(path: string[], value: any) {

    this.progress.update(obj => {
      const copy = structuredClone(obj);
      let curr: any = copy;
      for (let i = 0; i < path.length - 1; i++) {
        curr = curr[path[i]];
      }
      curr[path[path.length - 1]] = value;
      return copy;
    });
  }
}
