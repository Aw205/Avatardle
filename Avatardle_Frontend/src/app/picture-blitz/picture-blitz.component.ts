import { Component, inject, OnInit, signal, viewChild, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService, Episode } from '../services/data.service';
import { environment } from '../../environments/environment';
import { DigitFlowComponent } from 'ngx-digit-flow';
import { CountdownComponent, CountdownEvent } from 'ngx-countdown';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../services/auth.service';
import { LeaderboardService } from '../services/leaderboard.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SearchSelectComponent } from '../search-select/search-select.component';


@Component({
  selector: 'picture-blitz',
  imports: [FormsModule, DigitFlowComponent, CountdownComponent, TranslatePipe, SearchSelectComponent],
  templateUrl: './picture-blitz.component.html',
  styleUrl: './picture-blitz.component.css'

})
export class PictureBlitzComponent implements OnInit {

  ds = inject(DataService);

  isComplete: WritableSignal<boolean> = signal(false);

  private countdown = viewChild<CountdownComponent>('cd');
  private searchSelect = viewChild(SearchSelectComponent);

  private preloadedUrls: Set<string> = new Set();
  private frameQueue: { episode: string, url: string }[] = [];
  private readonly QUEUE_TARGET_SIZE = 5;

  pictureData: Episode | null = null;

  targetFrame: WritableSignal<string> = signal("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7");
  targetEpisode: string = "";
  frameLoaded: WritableSignal<boolean> = signal(false);

  score: WritableSignal<number> = signal(0);
  isTimerRunning: WritableSignal<boolean> = signal(false);

  countdownConfig: { leftTime: number, demand: boolean, format: string } = { leftTime: 180, demand: true, format: 'mm:ss' };

  episodeData: string[] = [];

  auth = inject(AuthService);
  leaderboardService = inject(LeaderboardService);
  usernameInput: WritableSignal<string> = signal('');
  snackBar = inject(MatSnackBar);
  submittedToLeaderboard: WritableSignal<boolean> = signal(false);


  ngOnInit() {
    this.ds.pictureData$.subscribe((data: Episode) => {
      this.pictureData = data;
      this.episodeData = [...this.ds.episodes.slice(0, 61)];
      this.fillFrameQueue();
    });
    this.auth.getMe().subscribe((data) => {
      this.usernameInput.set(data.username);
    });

  }

  startBlitz() {
    this.countdown()?.restart();
    this.countdown()?.begin();
    this.score.set(0);
    setTimeout(() => this.searchSelect()?.focus());
    this.setNextFrame();
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
        this.isTimerRunning.set(false);
        setTimeout(() => {
          window.scrollTo({ behavior: "smooth", top: document.body.scrollHeight })
        }, 500);
        break;
    }
  }

  buildFrameUrl(episode: string, frameIdx: number): string {
    const frameStr = String(frameIdx).padStart(3, '0');
    return `${environment.r2AssetUrl}/frames/${encodeURIComponent(episode)}/frame_${frameStr}.webp`.replace(/'/g, "%27");
  }

  fillFrameQueue() {
    if (!this.pictureData) return;

    const episodes = this.ds.episodes.slice(0, 61);
    while (this.frameQueue.length < this.QUEUE_TARGET_SIZE) {
      const ep = episodes[Math.floor(Math.random() * episodes.length)];
      const frameCount = this.pictureData[ep];
      const idx = Math.floor(Math.random() * frameCount);
      const url = this.buildFrameUrl(ep, idx);
      this.frameQueue.push({ episode: ep, url });
      this.preloadFrame(url);
    }
  }

  preloadFrame(url: string) {
    if (this.preloadedUrls.has(url)) return;
    const img = new Image();
    img.src = url;
    this.preloadedUrls.add(url);
  }

  setNextFrame() {
    if (!this.pictureData) return;

    if (this.frameQueue.length == 0) {
      this.fillFrameQueue();
    }

    const next = this.frameQueue.pop()!;
    this.targetEpisode = next.episode;

    this.frameLoaded.set(false);
    this.targetFrame.set(next.url);

  }

  onEnter(select: string | undefined) {

    if (!select) return;

    if (!this.isComplete() && select == this.targetEpisode) {
      this.score.update((val) => val + 1);
      this.setNextFrame();
      return;
    }
    if (this.isTimerRunning()) {
      this.isComplete.set(true);
      this.countdown()?.stop();
      setTimeout(() => {
        window.scrollTo({ behavior: "smooth", top: document.body.scrollHeight })
      }, 500);
    }
  }

  onImageLoad() {
    this.frameLoaded.set(true);
  }

  onImageError() {
    console.warn('Frame failed to load, re-rolling:', this.targetFrame());
    this.setNextFrame();
  }

  submitToLeaderboard() {

    this.leaderboardService.updateBlitzLeaderboard(this.usernameInput().trim(), "picture", this.score(), this.score()).subscribe({
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
