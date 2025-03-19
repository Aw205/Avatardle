import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Background } from './background/background.component';
import { tileData } from './tile/tile.component';


export interface AvatardleProgress {

  date: string,
  classic: { complete: boolean, target: string, guesses: tileData[] },
  quote: { complete: boolean, target: string, numGuesses: number },
  picture: { complete: boolean, target: string, numGuesses: number }

}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Background],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {

  ngOnInit() {

    let currentDate = new Date().toLocaleDateString();
    let emptyProgress: AvatardleProgress = {
      date: currentDate,
      classic: { complete: false, target: "", guesses: [] },
      quote: { complete: false, target: "", numGuesses: 0 },
      picture: { complete: false, target: "", numGuesses: 0 }
    };

    if (localStorage.getItem("avatardle_progress") != null) {
      try {
        let progress: AvatardleProgress = JSON.parse(localStorage.getItem("avatardle_progress")!);
        if (currentDate != progress.date) {
          emptyProgress.date = currentDate;
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
