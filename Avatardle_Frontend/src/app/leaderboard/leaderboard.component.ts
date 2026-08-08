import { ChangeDetectorRef, Component, inject, signal, WritableSignal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { HyphenatePipe } from '../pipes/hyphenate.pipe';
import { BlitzLeaderboardRecord, LeaderboardRecord } from '../services/leaderboard.service';
import { CountdownComponent } from 'ngx-countdown';
import { LocalStorageService } from '../services/local-storage.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Meta, Title } from '@angular/platform-browser';
import { environment } from '../../environments/environment';
import { RouterLink } from '@angular/router';
import { LeaderboardService } from '../services/leaderboard.service';
import { DataService } from '../services/data.service';

@Component({
  selector: 'leaderboard',
  imports: [HyphenatePipe, TranslatePipe, CountdownComponent, MatTooltipModule, RouterLink],
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.css'
})
export class LeaderboardComponent {

  ds = inject(DataService);
  leaderboardService = inject(LeaderboardService)
  ls = inject(LocalStorageService);
  title = inject(Title);
  meta = inject(Meta);
  cdr = inject(ChangeDetectorRef);
  list: WritableSignal<LeaderboardRecord[]> = signal([]);
  blitzRecords: WritableSignal<BlitzLeaderboardRecord[]> = signal([]);
  boardTypes = ["daily", "blitz"] as const;
  dailyModes = ["classic", "quote"] as const;
  blitzModes = ["quote", "picture"] as const;
  selectedBoardType: WritableSignal<"daily" | "blitz"> = signal("daily");
  selectedDailyMode: WritableSignal<string> = signal("classic");
  selectedBlitzMode: WritableSignal<string> = signal("quote");
  env = environment;

  ngOnInit() {

    this.loadDailyLeaderboard(this.selectedDailyMode());
    this.loadBlitzLeaderboard(this.selectedBlitzMode());

    this.title.setTitle("Leaderboard | Avatardle");
    this.meta.updateTag({
      name: "description",
      content: "Share scores and view other people's guesses in the Avatardle leaderboard!"
    });

    //this.loadSampleData();
  }

  /**
    * Only used in local to test
  */
  loadSampleData() {

    let chars = this.ds.characterFilter.classic["ATLA-title"];
    let arr: LeaderboardRecord[] = [];
    let blitzArr: BlitzLeaderboardRecord[] = [];
    let gus: string[] = [];
    for (let i = 0; i < 10; i++) {
      let str = Math.round(Math.random() * 10000).toString().substring(0, 5);
      for (let j = 0; j < 10; j++) {
        gus.push(chars[Math.floor(Math.random() * chars.length)]);
      }
      arr.push({ username: str, guesses: gus, time: "08:55", element: "fire" });
      blitzArr.push({username: str, score: Math.floor(Math.random()*20), streak:"--", time: "08:55", element: "air"})
      gus = [];
    }
    this.blitzRecords.set(blitzArr);
    this.list.set(arr);
  }

  sortTable() {
    this.list.set([...this.list()].reverse());
  }

  setBoardType(boardType: "daily" | "blitz") {
    this.selectedBoardType.set(boardType);
  }

  setDailyMode(mode: string) {
    this.selectedDailyMode.set(mode);
    this.loadDailyLeaderboard(mode);
  }

  setBlitzMode(mode: string) {
    this.selectedBlitzMode.set(mode);
    this.loadBlitzLeaderboard(mode);
  }

  loadDailyLeaderboard(mode: string) {
    this.leaderboardService.getLeaderboard(mode).subscribe(data => {
      this.list.set(data);
    })
  }

  loadBlitzLeaderboard(mode: string) {
    this.leaderboardService.getBlitzLeaderboard(mode).subscribe(data => {
      this.blitzRecords.set(data);
    })
  }

  onImageError(event: Event) {

    const img = event.target as HTMLImageElement;
    img.src = `${this.env.r2AssetUrl}/headshots/silhouette.webp`;
    img.classList = "aang";
    this.cdr.detectChanges();

  }

  getDate(time: string) {

    return time;
  }

  getTimeAgo(time: string) {

    const rtf = new Intl.RelativeTimeFormat(this.ls.progress().language, { numeric: 'auto' });
    let hours = parseInt(time.split(":")[0]);
    let minutes = parseInt(time.split(":")[1]);
    let d = new Date();
    d.setUTCHours(hours, minutes);
    const seconds = Math.round((Date.now() - d.getTime()) / 1000);
    const divisions = [
      { amount: 60, name: 'second' },
      { amount: 60, name: 'minute' },
      { amount: 24, name: 'hour' },
      { amount: 7, name: 'day' },
    ];

    let duration = seconds;

    for (const division of divisions) {
      if (duration < division.amount) {
        return rtf.format(Math.round(-duration), division.name as Intl.RelativeTimeFormatUnit);
      }
      duration /= division.amount;
    }
    return;
  }
}
