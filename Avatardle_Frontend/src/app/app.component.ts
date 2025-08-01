import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Background } from './background/background.component';
import { tileData } from './tile/tile.component';

export interface AvatardleProgress {

  date: string,
  version: string,
  classic: { complete: boolean, target: string, guesses: tileData[], series: string[] },
  quote: { complete: boolean, target: string, numGuesses: number },
  picture: { complete: boolean, target: string, numGuesses: number },
  particleSettings:{
    enable:boolean, customElement:string
  }
}

const VERSION = "1.1.0";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Background],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {


  ngOnInit() {

    let currentDate = new Date().toLocaleDateString("en-US",{timeZone:"UTC"});
    let emptyProgress: AvatardleProgress = {
      date: currentDate,
      version: VERSION,
      classic: { complete: false, target: "", guesses: [], series: ["Avatar: The Last Airbender"] },
      quote: { complete: false, target: "", numGuesses: 0 },
      picture: { complete: false, target: "", numGuesses: 0 },
      particleSettings:{
        enable: true,
        customElement: "none"
      }
      };

    if (localStorage.getItem("avatardle_progress") != null) {
      try {
        let progress: AvatardleProgress = JSON.parse(localStorage.getItem("avatardle_progress")!);
        if (currentDate != progress.date || progress.version != emptyProgress.version) {
          localStorage.setItem("avatardle_progress",JSON.stringify(emptyProgress));
        }
      }
      catch (e) {
        console.error(e);
        localStorage.setItem("avatardle_progress", JSON.stringify(emptyProgress));
      }
    }
    else {
      localStorage.setItem("avatardle_progress", JSON.stringify(emptyProgress));
    }
  }

}
