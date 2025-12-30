import { Component, inject, signal, WritableSignal } from '@angular/core';
import { MatDialogTitle, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { HyphenatePipe } from '../pipes/hyphenate.pipe';
import { DataService, LeaderboardRecord } from '../services/data.service';
import { LocalStorageService } from '../services/local-storage.service';

@Component({
  selector: 'leaderboard-dialog',
  imports: [MatDialogContent, MatDialogTitle, FormsModule, HyphenatePipe,TranslatePipe],
  templateUrl: './leaderboard-dialog.component.html',
  styleUrl: './leaderboard-dialog.component.css'
})
export class LeaderboardDialogComponent {

  ds = inject(DataService);
  ls = inject(LocalStorageService);
  list: WritableSignal<LeaderboardRecord[]> = signal([]);

  constructor(public dialogRef: MatDialogRef<LeaderboardDialogComponent>) { }

  ngOnInit() {

    this.ds.leaderboard$.subscribe((data)=>{
      this.list.set(data);
    });
  }

  getTimeAgo(time:string) {

    const rtf = new Intl.RelativeTimeFormat(this.ls.progress().language, { numeric: 'auto' });
    let hours = parseInt(time.split(":")[0]);
    let minutes = parseInt(time.split(":")[1]);
    let d = new Date();
    d.setUTCHours(hours,minutes);
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
