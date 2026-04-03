import { ChangeDetectorRef, Component, inject, signal, WritableSignal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { HyphenatePipe } from '../pipes/hyphenate.pipe';
import { DataService, LeaderboardRecord } from '../services/data.service';
import { CountdownComponent } from 'ngx-countdown';
import { MatMenuModule } from '@angular/material/menu';
import { LocalStorageService } from '../services/local-storage.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Meta, Title } from '@angular/platform-browser';
import { environment } from '../../environments/environment';

@Component({
  selector: 'leaderboard',
  imports: [HyphenatePipe, TranslatePipe, CountdownComponent, MatMenuModule, MatTooltipModule],
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.css'
})
export class LeaderboardComponent {

  ds = inject(DataService);
  ls = inject(LocalStorageService);
  title = inject(Title);
  meta = inject(Meta);
  cdr = inject(ChangeDetectorRef);
  list: WritableSignal<LeaderboardRecord[]> = signal([]);
  modes: string[] = ["classic"];
  env = environment;

  ngOnInit() {

    this.ds.leaderboard$.subscribe((data)=>{
      this.list.set(data);
    });
    this.title.setTitle("Leaderboard | Avatardle");
    this.meta.updateTag({
      name: "description",
      content: "Share scores and view other people's guesses in the Avatardle leaderboard!"
    });

    // let chars = this.ds.characterFilter.classic["ATLA-title"];
    // let arr: LeaderboardRecord[] = [];
    // let gus: string[] = [];
    // for (let i = 0; i < 10; i++) {
    //   let str = Math.round(Math.random() * 10000).toString().substring(0, 5);
    //   for (let j = 0; j < 10; j++) {
    //     gus.push(chars[Math.floor(Math.random() * chars.length)]);
    //   }
    //   arr.push({ username: str, guesses: gus, time: "08:55" });
    //   gus = [];
    // }
    // this.list.set(arr);
  }

  sortTable() {
    this.list.set([...this.list()].reverse());
  }

  onImageError(event: Event) {

    const img = event.target as HTMLImageElement;
    img.src = `${this.env.R2Url}/headshots/silhouette.webp`;
    img.classList = "aang";
    this.cdr.detectChanges();

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


