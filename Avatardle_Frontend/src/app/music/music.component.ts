import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, ViewChild, WritableSignal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { DataService, Ost } from '../services/data.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { TmNgOdometerModule } from 'odometer-ngx';
import { AsyncPipe } from '@angular/common';
import { CountdownComponent } from 'ngx-countdown';
import Rand from 'rand-seed';
import { ExpandImageDialogComponent } from '../expand-image-dialog/expand-image-dialog.component';
import { environment } from '../../environments/environment';
import { LocalStorageService } from '../services/local-storage.service';
import { ShareResultsComponent } from '../share-results/share-results.component';

@Component({
  selector: 'music',
  imports: [DatePipe, TranslatePipe, FormsModule, MatTooltipModule, TmNgOdometerModule, AsyncPipe, CountdownComponent,ShareResultsComponent],
  templateUrl: './music.component.html',
  styleUrl: './music.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MusicMode {

  title = inject(Title);
  meta = inject(Meta);
  ls = inject(LocalStorageService);
  ds = inject(DataService);
  dialog = inject(MatDialog);

  rand = new Rand(new Date().toLocaleDateString("en-US", { timeZone: "UTC" }) + "music");
  isPaused: WritableSignal<boolean> = signal(true);
  isComplete: WritableSignal<boolean> = signal(false);
  selected: WritableSignal<Set<string>> = signal(new Set<string>());
  progress: WritableSignal<number> = signal(0);
  images: WritableSignal<string[]> = signal([]);
  hints: { title: string, body: string, show: boolean }[] | undefined;


  pmoveListener: EventListener = this.update.bind(this);
  pupListener: EventListener = this.onPointerUp.bind(this);
  isDragging: boolean = false;
  isBrowser = (typeof window != "undefined");

  audio: HTMLAudioElement | undefined;


  /**
   * The current time of the music clip in seconds.
   * @type {number}
   */
  displayCurrTime: WritableSignal<number> = signal(0);

  /**
   * The duration of the music clip in seconds.
   * @type {number}
   */
  duration: WritableSignal<number> = signal(30);
  animId: number = 0;
  timeOffset: number = 0;
  targetOST: Ost | undefined;
  targetScene: string = "";

  @ViewChild('slider') slider!: ElementRef<HTMLDivElement>;

  ngOnInit() {
    this.title.setTitle("Music | Avatardle");
    this.meta.updateTag({
      name: "description",
      content: "Play Music Mode on Avatardle, the daily Avatar guessing game. Guess and match music to scenes from Avatar: The Last Airbender!"
    });

    if (this.isBrowser) {

      this.isComplete.set(this.ls.progress().music.complete);
      this.ds.osts$.subscribe(data => {

        this.targetOST = data[Math.floor(this.rand.next() * data.length)];
        let audioName = encodeURIComponent(this.targetOST.audio);
        this.audio = new Audio(`${environment.R2Url}/osts/${audioName}`);
        this.audio.addEventListener('loadedmetadata', () => {
          this.timeOffset = Math.floor(this.rand.next() * (this.audio!.duration - 30));
          this.audio!.currentTime = this.timeOffset;
        });

        this.hints = [
          { title: "music.char-hint", body: this.targetOST.characters[Math.floor(this.rand.next() * this.targetOST.characters.length)], show: false },
          { title: "music.music-hint", body: "", show: false },
        ];

        while (this.images().length != 8) {
          let randomOST = data[Math.floor(this.rand.next() * data.length)];
          if (randomOST.name != this.targetOST.name) {
            let numScenes = String(Math.floor(this.rand.next() * randomOST.numScenes) + 1).padStart(3, "0");
            let name = encodeURIComponent(randomOST.name);
            let frame = `${environment.R2Url}/scenes/${name}/scene_${numScenes}.webp`;
            this.images().push(frame);
          }
        }
        let targetName = encodeURIComponent(this.targetOST.name);
        let targetNumScenes = String(this.targetOST.numScenes).padStart(3, "0");
        this.targetScene = `${environment.R2Url}/scenes/${targetName}/scene_${targetNumScenes}.webp`;
        this.images().splice(this.rand.next() * 8, 0, this.targetScene);
        this.images.set([...this.images()]);
      });
    }
  }

  togglePlay() {
    this.isPaused.set(!this.isPaused());
    if (this.isPaused()) {
      this.audio!.pause();
      cancelAnimationFrame(this.animId);
    }
    else {
      if (this.displayCurrTime() >= this.duration()) {
        this.progress.set(0);
        this.audio!.currentTime = this.timeOffset;
        this.displayCurrTime.set(0);
      }
      this.audio!.play();
      this.animateThumb();
    }
  }

  isEnabled(hintId: number) {

    return this.isComplete() || this.ls.progress().music.numGuesses >= 2 + hintId;
  }

  getTooltipText(hintId: number): string {

    let diff = hintId + 2 - this.ls.progress().music.numGuesses;
    if (diff <= 0 || this.isComplete()) {
      return "Hint available!";
    }
    else if (diff == 1) {
      return "Hint in 1 more guess";
    }
    return `Hint in ${diff} more guesses`;
  }

  animateThumb() {

    if (this.displayCurrTime() >= this.duration()) {
      return this.togglePlay();
    }
    if (this.isDragging) {
      return cancelAnimationFrame(this.animId);
    }
    else if (this.audio!.duration) {
      this.progress.set((this.audio!.currentTime - this.timeOffset) / this.duration());
      this.displayCurrTime.set((this.audio!.currentTime - this.timeOffset));
    }
    this.animId = requestAnimationFrame(this.animateThumb.bind(this));
  }

  onPointerDown(event: PointerEvent) {
    this.isDragging = true;
    this.update(event);
    addEventListener('pointermove', this.pmoveListener);
    addEventListener('pointerup', this.pupListener);
  }

  onPointerUp() {
    this.isDragging = false;
    this.audio!.currentTime = this.timeOffset + this.progress() * this.duration();
    if (!this.isPaused()) {
      this.animateThumb();
    }
    removeEventListener('pointermove', this.pmoveListener);
    removeEventListener('pointerup', this.pupListener);
  }

  update(event: Event) {

    let c = event as PointerEvent;
    let rect = this.slider.nativeElement.getBoundingClientRect();
    let x = Math.max(0, Math.min(c.clientX - rect.left, rect.width));
    this.progress.set(x / rect.width);
    this.displayCurrTime.set(this.duration() * this.progress());
  }

  expandImage(imgURL: string) {

    this.dialog.open(ExpandImageDialogComponent, {
      width: '40vw', maxWidth: 'none', panelClass: 'responsive-panel', data: {
        isComplete: this.isComplete(),
        imageUrl: imgURL
      }
    }).afterClosed().subscribe((data) => {
      if (data) {
        if (imgURL.includes(encodeURIComponent(this.targetOST!.name))) {
          this.isComplete.set(true);
          this.ls.patch(['music'], { complete: true, numGuesses: this.ls.progress().music.numGuesses + 1 });
          this.ds.throwConfetti(this.ls.progress().music.numGuesses);
          this.ds.updateStats("music");
          setTimeout(() => {
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
    this.hints![hintId].show = true;
    if (hintId == 1) {
      this.isPaused.set(true);
      this.audio!.pause();
      this.duration.set(this.audio!.duration);
      cancelAnimationFrame(this.animId);
      this.progress.set(0);
      this.audio!.currentTime = 0;
      this.timeOffset = 0;
      this.displayCurrTime.set(0);
    }
  }

}
