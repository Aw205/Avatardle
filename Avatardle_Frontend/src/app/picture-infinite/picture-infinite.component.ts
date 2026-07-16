import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService, Episode } from '../services/data.service';
import { environment } from '../../environments/environment';
import { DigitFlowComponent } from 'ngx-digit-flow';


@Component({
  selector: 'picture-infinite',
  imports: [FormsModule, DigitFlowComponent],
  templateUrl: './picture-infinite.component.html',
  styleUrl: './picture-infinite.component.css'

})
export class PictureInfiniteComponent implements OnInit {

  ds = inject(DataService);

  pictureData: Episode | null = null;

  targetFrame: WritableSignal<string> = signal("");
  targetEpisode: string = "";

  score: WritableSignal<number> = signal(0);
  isComplete: WritableSignal<boolean> = signal(false);
  hasStarted: WritableSignal<boolean> = signal(false);
  isVisible: WritableSignal<boolean> = signal(false);
  highlightedIndex: WritableSignal<number> = signal(-1);

  searchVal: string = "";
  selected: string = "";
  episodeList: string[] = [];
  episodeData: string[] = [];

  guesses: { episode: string, isCorrect: boolean }[] = [];

  ngOnInit() {
    this.ds.pictureData$.subscribe((data: Episode) => {
      this.pictureData = data;
      this.startGame();
    });
  }

  startGame() {
    this.score.set(0);
    this.isComplete.set(false);
    this.hasStarted.set(true);
    this.guesses = [];
    this.setNextFrame();
  }

  setNextFrame() {
    if (!this.pictureData) return;

    const episodes = this.ds.episodes.slice(0, 61);
    this.targetEpisode = episodes[Math.floor(Math.random() * episodes.length)];

    const frameCount = this.pictureData[this.targetEpisode];
    const frameIdx = Math.floor(Math.random() * frameCount);
    const frameStr = String(frameIdx).padStart(3, '0');

    this.targetFrame.set(`${environment.r2AssetUrl}/frames/${encodeURIComponent(this.targetEpisode)}/frame_${frameStr}.webp`.replace(/'/g, "%27"));

    this.episodeData = [...episodes];
    this.searchVal = "";
    this.episodeList = [];
    this.selected = "";
    this.highlightedIndex.set(-1);
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
    if (this.isComplete()) return;

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
      this.ds.throwConfetti(1);
      this.setNextFrame();
    } else {
      this.guesses.unshift({ episode: this.selected, isCorrect: false });
      this.isComplete.set(true);
    }
  }

  onImageError() {
    console.warn('Frame failed to load, re-rolling:', this.targetFrame());
    this.setNextFrame();
  }

  restart() {
    this.startGame();
  }
}