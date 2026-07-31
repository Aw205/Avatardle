import { Component, ElementRef, inject, OnInit, signal, viewChild, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService, Episode } from '../services/data.service';
import { environment } from '../../environments/environment';
import { DigitFlowComponent } from 'ngx-digit-flow';
import { CountdownComponent, CountdownEvent } from 'ngx-countdown';


@Component({
  selector: 'picture-infinite',
  imports: [FormsModule, DigitFlowComponent, CountdownComponent],
  templateUrl: './picture-infinite.component.html',
  styleUrl: './picture-infinite.component.css'

})
export class PictureInfiniteComponent implements OnInit {

  ds = inject(DataService);

  private countdown = viewChild<CountdownComponent>('cd');
  private searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  private hoverLeaveTimeout: ReturnType<typeof setTimeout> | null = null;
  private preloadedUrls: Set<string> = new Set();
  private frameQueue: { episode: string, url: string }[] = [];
  private readonly QUEUE_TARGET_SIZE = 5;

  pictureData: Episode | null = null;

  targetFrame: WritableSignal<string> = signal("");
  targetEpisode: string = "";
  frameLoaded: WritableSignal<boolean> = signal(false);

  score: WritableSignal<number> = signal(0);
  scorePopped: WritableSignal<boolean> = signal(false);
  isComplete: WritableSignal<boolean> = signal(false);
  roundStarted: WritableSignal<boolean> = signal(false);
  isVisible: WritableSignal<boolean> = signal(false);
  highlightedIndex: WritableSignal<number> = signal(-1);
  isTimerRunning: WritableSignal<boolean> = signal(false);
  timedOut: WritableSignal<boolean> = signal(false);

  timeOptions: { label: string, value: number }[] = [
    { label: '1m', value: 60 },
    { label: '2m', value: 120 },
    { label: '3m', value: 180 }
  ];
  selectedTime: WritableSignal<number> = signal(180);
  timeDropdownOpen: WritableSignal<boolean> = signal(false);

  countdownConfig: { leftTime: number, demand: boolean, format: string } = { leftTime: 180, demand: true, format: 'mm:ss' };

  searchVal: string = "";
  selected: string = "";
  episodeList: string[] = [];
  episodeData: string[] = [];

  guesses: { episode: string, isCorrect: boolean }[] = [];

  ngOnInit() {
    this.ds.pictureData$.subscribe((data: Episode) => {
      this.pictureData = data;
      this.prepareRound();
    });
  }

  prepareRound() {
    this.score.set(0);
    this.isComplete.set(false);
    this.timedOut.set(false);
    this.roundStarted.set(false);
    this.guesses = [];
    this.frameQueue = [];
    this.countdownConfig = { leftTime: this.selectedTime(), demand: true, format: 'mm:ss' };
    this.setNextFrame();
  }

  startRound() {
    this.roundStarted.set(true);
    this.countdown()?.restart();
    this.countdown()?.begin();
    setTimeout(() => this.searchInput()?.nativeElement.focus());
  }

  onPlayButtonClick() {
    if (this.isComplete()) {
      this.restart();
    } else {
      this.startRound();
    }
  }

  onTimerHover(isHovering: boolean) {
    if (this.isTimerRunning()) return;

    if (isHovering) {
      if (this.hoverLeaveTimeout) {
        clearTimeout(this.hoverLeaveTimeout);
        this.hoverLeaveTimeout = null;
      }
      this.timeDropdownOpen.set(true);
    } else {
      this.hoverLeaveTimeout = setTimeout(() => {
        this.timeDropdownOpen.set(false);
      }, 150);
    }
  }

  selectTime(value: number) {
    this.selectedTime.set(value);
    this.timeDropdownOpen.set(false);
    this.prepareRound();
  }

  triggerScorePop() {
    this.scorePopped.set(true);
    setTimeout(() => this.scorePopped.set(false), 300);
  }

  handleCountdownEvent(event: CountdownEvent) {
    switch (event.action) {
      case 'start':
        this.isTimerRunning.set(true);
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
        this.isTimerRunning.set(false);
        this.timedOut.set(true);
        this.isComplete.set(true);
        this.roundStarted.set(false);
        break;
    }
  }

  buildFrameUrl(episode: string, frameIdx: number): string {
    const frameStr = String(frameIdx).padStart(3, '0');
    return `${environment.r2AssetUrl}/frames/${encodeURIComponent(episode)}/frame_${frameStr}.webp`.replace(/'/g, "%27");
  }

  preloadFrame(url: string) {
    if (this.preloadedUrls.has(url)) return;
    const img = new Image();
    img.src = url;
    this.preloadedUrls.add(url);
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

  setNextFrame() {
    if (!this.pictureData) return;

    if (this.frameQueue.length == 0) {
      this.fillFrameQueue();
    }

    const next = this.frameQueue.shift()!;
    this.targetEpisode = next.episode;

    this.frameLoaded.set(false);
    this.targetFrame.set(next.url);

    this.episodeData = [...this.ds.episodes.slice(0, 61)];
    this.searchVal = "";
    this.episodeList = [];
    this.selected = "";
    this.highlightedIndex.set(-1);

    this.fillFrameQueue();
  }

  onInput(event: Event) {
    this.searchVal = (event.target as HTMLInputElement).value;
    this.isVisible.set(true);
    this.episodeList = this.searchVal == ""
      ? this.episodeData
      : this.episodeData.filter(epi => epi.toLowerCase().includes(this.searchVal.toLowerCase()));
    this.selected = this.episodeList.length == 0 ? "" : this.episodeList[0];
    this.highlightedIndex.set(-1);
  }

  moveHighlight(direction: number) {
    if (this.episodeList.length == 0) return;

    let newIndex = this.highlightedIndex() + direction;

    if (newIndex < 0) newIndex = this.episodeList.length - 1;
    if (newIndex >= this.episodeList.length) newIndex = 0;

    this.highlightedIndex.set(newIndex);
  }

  onEnter(select: string = "") {
    if (this.isComplete() || !this.roundStarted()) return;

    if (select == "" && this.highlightedIndex() >= 0 && this.episodeList[this.highlightedIndex()]) {
      select = this.episodeList[this.highlightedIndex()];
    }

    if (select != "") {
      this.selected = select;
    }
    if (this.selected == "") return;

    if (this.selected == this.targetEpisode) {
      this.guesses.unshift({ episode: this.selected, isCorrect: true });
      this.score.update(v => v + 1);
      this.triggerScorePop();
      this.setNextFrame();
    } else {
      this.guesses.unshift({ episode: this.selected, isCorrect: false });
      this.isComplete.set(true);
      this.roundStarted.set(false);
      this.countdown()?.stop();
    }
  }

  onImageLoad() {
    this.frameLoaded.set(true);
  }

  onImageError() {
    console.warn('Frame failed to load, re-rolling:', this.targetFrame());
    this.setNextFrame();
  }

  restart() {
    this.prepareRound();
    setTimeout(() => this.startRound());
  }
}