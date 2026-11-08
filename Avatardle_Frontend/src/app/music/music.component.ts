import { Component, DestroyRef, Inject, inject, PLATFORM_ID, signal, WritableSignal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { AsyncPipe, DatePipe, isPlatformBrowser } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { DataService, Ost } from '../services/data.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { CountdownComponent } from 'ngx-countdown';
import Rand from 'rand-seed';
import { ExpandImageDialogComponent } from '../expand-image-dialog/expand-image-dialog.component';
import { environment } from '../../environments/environment';
import { LocalStorageService } from '../services/local-storage.service';
import { ShareResultsComponent } from '../share-results/share-results.component';
import { DigitFlowComponent } from 'ngx-digit-flow';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { getHintTooltip } from '../game-mode-utils';

@Component({
  selector: 'music',
  imports: [DatePipe, TranslatePipe, MatTooltipModule, DigitFlowComponent, AsyncPipe, CountdownComponent, ShareResultsComponent],
  templateUrl: './music.component.html',
  styleUrl: './music.component.css'
})
export class MusicMode {

  title = inject(Title);
  meta = inject(Meta);
  ls = inject(LocalStorageService);
  ds = inject(DataService);
  dialog = inject(MatDialog);

  rand = new Rand(new Date().toLocaleDateString("en-US", { timeZone: "UTC" }) + "music");
  isPaused: WritableSignal<boolean> = signal(true);
  readonly audioReady = signal(false);
  readonly audioUnavailable = signal(false);
  private playbackRequest = 0;
  private readonly destroyRef = inject(DestroyRef);
  private readonly audioEvents = new AbortController();
  private scrollTimer?: ReturnType<typeof setTimeout>;
  isComplete: WritableSignal<boolean> = signal(false);
  selected: WritableSignal<Set<string>> = signal(new Set<string>());
  progress: WritableSignal<number> = signal(0);
  images: WritableSignal<string[]> = signal([]);
  readonly hints = signal<{ title: string; body: string; show: boolean }[]>([]);

  audio: HTMLAudioElement | undefined;

  readonly displayCurrTime = signal(0);
  readonly duration = signal(30);
  animId: number = 0;
  timeOffset: number = 0;
  targetOST: Ost | undefined;
  targetScene: string = "";

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  ngOnInit() {
    this.title.setTitle("Music | Avatardle");
    this.meta.updateTag({
      name: "description",
      content: "Play Music Mode on Avatardle, the daily Avatar guessing game. Guess and match music to scenes from Avatar: The Last Airbender!"
    });

    if (isPlatformBrowser(this.platformId)) {

      this.isComplete.set(this.ls.progress().music.complete);
      this.ds.osts$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(data => {
        if (!data.length) return;

        this.targetOST = data[Math.floor(this.rand.next() * data.length)];
        const selectedOSTs = [this.targetOST.name];

        const audioName = encodeURIComponent(this.targetOST.audio);
        const audio = this.audio = new Audio(`${environment.r2AssetUrl}/osts/${audioName}`);
        audio.addEventListener('loadedmetadata', () => {
          if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
          this.duration.set(Math.min(30, audio.duration));
          this.timeOffset = Math.floor(this.rand.next() * Math.max(0, audio.duration - this.duration()));
          audio.currentTime = this.timeOffset;
          this.audioReady.set(true);
        }, { signal: this.audioEvents.signal });
        audio.addEventListener('error', () => {
          this.audioReady.set(false);
          this.audioUnavailable.set(true);
          this.pausePlayback();
        }, { signal: this.audioEvents.signal });

        this.hints.set([
          { title: "music.char-hint", body: this.targetOST.characters[Math.floor(this.rand.next() * this.targetOST.characters.length)], show: false },
          { title: "music.music-hint", body: "", show: false },
        ]);

        const images: string[] = [];
        while (images.length < 8 && selectedOSTs.length < data.length) {
          const randomOST = data[Math.floor(this.rand.next() * data.length)];
          if (!selectedOSTs.includes(randomOST.name)) {

            selectedOSTs.push(randomOST.name);
            const numScenes = String(Math.floor(this.rand.next() * randomOST.numScenes) + 1).padStart(3, "0");
            const name = encodeURIComponent(randomOST.name).replace(/'/g, "%27");
            const frame = `${environment.r2AssetUrl}/scenes/${name}/scene_${numScenes}.webp`;
            images.push(frame);
          }
        }
        const targetName = encodeURIComponent(this.targetOST.name);
        const targetNumScenes = String(Math.floor(this.rand.next() * this.targetOST.numScenes) + 1).padStart(3, "0");
        this.targetScene = `${environment.r2AssetUrl}/scenes/${targetName}/scene_${targetNumScenes}.webp`;
        images.splice(Math.floor(this.rand.next() * images.length), 0, this.targetScene);
        this.images.set(images);
      });
    }
  }

  togglePlay() {
    if (!this.audio || !this.audioReady()) {
      return;
    }
    if (!this.isPaused()) {
      this.pausePlayback();
      return;
    }
    if (this.displayCurrTime() >= this.duration()) this.seekTo(0);

    const request = ++this.playbackRequest;
    this.isPaused.set(false);
    this.audio.play().then(() => {
      if (request === this.playbackRequest && !this.isPaused()) this.animateThumb();
    }).catch(() => {
      if (request === this.playbackRequest) this.pausePlayback();
    });
  }

  private pausePlayback() {
    this.playbackRequest++;
    this.isPaused.set(true);
    this.audio?.pause();
    if (isPlatformBrowser(this.platformId)) cancelAnimationFrame(this.animId);
  }

  isEnabled(hintId: number) {
    return this.isComplete() || this.ls.progress().music.numGuesses >= 2 + hintId;
  }

  getTooltipText(hintId: number): string {
    return getHintTooltip(this.isComplete(), this.ls.progress().music.numGuesses, 2, hintId);
  }

  private readonly animateThumb = () => {
    if (!this.audio || this.isPaused()) return;
    const elapsed = Math.max(0, Math.min(this.duration(), this.audio.currentTime - this.timeOffset));
    this.displayCurrTime.set(elapsed);
    this.progress.set(elapsed / this.duration());
    if (elapsed >= this.duration()) {
      this.pausePlayback();
      return;
    }
    this.animId = requestAnimationFrame(this.animateThumb);
  };

  seek(event: Event) {
    if (!this.audio || !this.audioReady()) {
      return;
    }
    this.seekTo(Number((event.target as HTMLInputElement).value) / 100);
  }

  private seekTo(value: number) {
    const progress = Math.max(0, Math.min(1, value));
    this.progress.set(progress);
    this.displayCurrTime.set(this.duration() * progress);
    if (this.audio) this.audio.currentTime = this.timeOffset + this.displayCurrTime();
  }

  expandImage(imgURL: string) {

    this.dialog.open(ExpandImageDialogComponent, {
      width: '40vw', maxWidth: 'none', panelClass: 'responsive-panel', data: {
        isComplete: this.isComplete(),
        imageUrl: imgURL
      }
    }).afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data) => {
      if (data) {
        if (imgURL.includes(encodeURIComponent(this.targetOST!.name))) {
          this.isComplete.set(true);
          this.ls.patch(['music'], { complete: true, numGuesses: this.ls.progress().music.numGuesses + 1 });
          this.ds.throwConfetti(this.ls.progress().music.numGuesses);
          this.ds.updateStats("music");
          this.scrollTimer = setTimeout(() => {
            window.scrollTo({ behavior: "smooth", top: document.body.scrollHeight })
          }, 1000);
          return;
        }
        this.ls.patch(['music', 'numGuesses'], this.ls.progress().music.numGuesses + 1);
        this.selected.update(val => new Set<string>([...val, imgURL]));
      }
    });
  }

  revealHint(hintId: number) {
    const hint = this.hints()[hintId];
    if (!hint || hint.show || !this.isEnabled(hintId) || (hintId === 1 && !this.audioReady())) return;

    this.hints.update(hints => hints.map((item, index) => index === hintId ? { ...item, show: true } : item));
    if (hintId === 1 && this.audio) {
      this.pausePlayback();
      this.duration.set(this.audio.duration);
      this.timeOffset = 0;
      this.seekTo(0);
    }
  }

  ngOnDestroy() {
    this.audioEvents.abort();
    this.pausePlayback();
    clearTimeout(this.scrollTimer);
  }
}
