import { Component, computed, inject, Signal, signal, viewChild, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CountdownComponent, CountdownEvent } from 'ngx-countdown';
import { DataService } from '../services/data.service';
import { HyphenatePipe } from '../pipes/hyphenate.pipe';
import { TranslatePipe } from '@ngx-translate/core';
import { DigitFlowComponent } from 'ngx-digit-flow';
import { AuthService } from '../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LeaderboardService } from '../services/leaderboard.service';

@Component({
  selector: 'quote-blitz',
  imports: [FormsModule, HyphenatePipe, CountdownComponent, TranslatePipe, DigitFlowComponent],
  templateUrl: './quote-blitz.component.html',
  styleUrl: '../quote/quote.component.css',
})
export class QuoteBlitzComponent {

  quote: WritableSignal<string> = signal(' ');

  isVisible: WritableSignal<boolean> = signal(false);

  private countdown = viewChild<CountdownComponent>('cd');
  score: WritableSignal<number> = signal(0);
  target: WritableSignal<string> = signal('');
  strikes: WritableSignal<number> = signal(0);
  streak: WritableSignal<number> = signal(0);
  isComplete: WritableSignal<boolean> = signal(false);
  guesses: { char: string, isCorrect: boolean }[] = [];
  isTimerRunning: WritableSignal<boolean> = signal(false);

  searchVal: WritableSignal<string> = signal('');
  transcript: any[] = [];

  charList: Signal<string[]> = computed(() => {
    let val = this.searchVal().toLowerCase();
    return this.characterData.filter(char => val != '' && char.toLowerCase().includes(val));
  });
  characterData: string[] = [];
  ds = inject(DataService);
  auth = inject(AuthService);
  leaderboardService = inject(LeaderboardService);
  usernameInput: WritableSignal<string> = signal('');
  snackBar = inject(MatSnackBar);
  submittedToLeaderboard: WritableSignal<boolean> = signal(false);

  ngOnInit() {

    this.characterData = this.ds.getQuoteCharacterData();
    this.ds.transcript$.subscribe((data) => {
      this.transcript = data;
    });
    this.auth.getMe().subscribe((data) => {
      this.usernameInput.set(data.username);
    });

  }

  onEnter(select: string | undefined) {

    if (!select) return;
  
    if (!this.isComplete() && select == this.target()) {
      this.searchVal.set('');
      this.score.update((val) => val + 1);
      this.streak.update((val) => val + 1);
      this.setNextQuote();
      this.guesses.push({ char: select, isCorrect: true });
      return;
    }
    this.searchVal.set('');
    if (this.isTimerRunning()) {
      this.strikes.update((val) => val + 1);
      this.guesses.push({ char: select, isCorrect: false });
      if (this.strikes() === 3) {
        this.isComplete.set(true);
        this.countdown()?.stop();
        setTimeout(() => {
          window.scrollTo({ behavior: "smooth", top: document.body.scrollHeight })
        }, 500);

        let currStreak = 0;
        let longestStreak = 0;
        for (let g of this.guesses) {
          if (g.isCorrect) {
            currStreak++;
            longestStreak = Math.max(longestStreak, currStreak);
          }
          else {
            currStreak = 0;
          }
        }
        this.streak.set(longestStreak);
        return;
      }
      this.setNextQuote();
    }
  }

  setNextQuote() {
    let char = Object.keys(this.ds.quoteIndices)[Math.floor(Math.random() * Object.keys(this.ds.quoteIndices).length)];
    this.target.set(char);
    let idxArr = this.ds.quoteIndices[char];
    let idx = idxArr[Math.floor(Math.random() * idxArr.length)];
    this.quote.set(this.transcript[idx].script);
  }


  startBlitz() {

    this.setNextQuote();
    this.strikes.set(0);
    this.score.set(0);
    this.countdown()?.restart();
    this.countdown()?.begin();
    this.guesses = [];
    this.submittedToLeaderboard.set(false);
  }

  handleCountdownEvent(event: CountdownEvent) {
    switch (event.action) {
      case 'start':
        this.isTimerRunning.set(true);
        this.isComplete.set(false);
        break;
      case 'resume':
        this.isTimerRunning.set(true);
        break;
      case 'pause':
        this.isTimerRunning.set(false);
        break;
      case 'stop':
        this.isTimerRunning.set(false);
        break;
      case 'done':
        this.isComplete.set(true);
        setTimeout(() => {
          window.scrollTo({ behavior: "smooth", top: document.body.scrollHeight })
        }, 500);
        this.isTimerRunning.set(false);
        break;
    }
  }

  submitToLeaderboard() {

    this.leaderboardService.updateBlitzLeaderboard(this.usernameInput().trim(), "quote", this.score(), this.streak()).subscribe({
      error: (err) => {
        console.log("Error submitting to blitz leaderboard");
      },
      complete: () => {
        this.snackBar.open("Submitted!", undefined, { panelClass: "snack-bar", duration: 4000 });
        this.submittedToLeaderboard.set(true);
      },
    });
  }

}
