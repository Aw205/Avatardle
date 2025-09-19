import { afterNextRender, inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { tileData } from '../tile/tile.component';

export interface AvatardleProgress {
  date: string,
  version: string,
  classic: { complete: boolean, target: string, guesses: tileData[], series: string[] },
  quote: { complete: boolean, target: string, numGuesses: number },
  picture: { complete: boolean, target: string, numGuesses: number },
  particleSettings: { enable: boolean },
  language: string | undefined
}

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  VERSION: string = "1.2.1";
  currentDate = new Date().toLocaleDateString("en-US", { timeZone: "UTC" });
  progress!: AvatardleProgress;
  default: AvatardleProgress = {
    date: this.currentDate,
    version: this.VERSION,
    classic: { complete: false, target: "", guesses: [], series: ["ATLA-title"] },
    quote: { complete: false, target: "", numGuesses: 0 },
    picture: { complete: false, target: "", numGuesses: 0 },
    particleSettings: {
      enable: true
    },
    language: undefined
  };


  constructor() {

    let ts = inject(TranslateService);
    afterNextRender(() => {
      if (localStorage.getItem("avatardle_progress") != null) {
        try {
          this.progress = JSON.parse(localStorage.getItem("avatardle_progress")!);
          if (this.progress.version != this.default.version) {
            this.update(this.default);
            this.progress = this.default;
          }
          else if (this.currentDate != this.progress.date) {
            this.default.language = this.progress.language;
            this.default.classic.series = this.progress.classic.series ?? ["ATLA-title"];
            this.update(this.default);
            this.progress = this.default;
          }
        }
        catch (e) {
          console.error(e);
          this.update(this.default);
          this.progress = this.default;
        }
      }
      else {
        this.update(this.default);
        this.progress = this.default;
      }
      ts.use(this.progress?.language ?? navigator.language.split("-")[0]);
    });
  }

  update(data: AvatardleProgress = this.progress) {
    localStorage.setItem("avatardle_progress", JSON.stringify(data));
  }
}
