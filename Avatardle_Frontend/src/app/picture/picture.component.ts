import { Component, Inject, inject, PLATFORM_ID, signal, WritableSignal } from '@angular/core';
import { DataService, Episode } from '../services/data.service';
import { Subscription } from 'rxjs';
import { AsyncPipe, isPlatformBrowser } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Meta, Title } from '@angular/platform-browser';
import { LocalStorageService } from '../services/local-storage.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { SurrenderDialogComponent } from '../surrender-dialog/surrender-dialog.component';
import Rand from 'rand-seed';
import { environment } from '../../environments/environment';
import { ExpandImageDialogComponent } from '../expand-image-dialog/expand-image-dialog.component';
import { getHintTooltip, getSurrenderText } from '../game-mode-utils';
import { DigitFlowComponent } from 'ngx-digit-flow';
import { PictureBlitzComponent } from '../picture-blitz/picture-blitz.component';
import { SearchSelectComponent } from '../search-select/search-select.component';


@Component({
  selector: 'picture',
  imports: [DigitFlowComponent, AsyncPipe, TranslatePipe, MatTooltipModule, PictureBlitzComponent, SearchSelectComponent],
  templateUrl: './picture.component.html',
  styleUrl: './picture.component.css'
})
export class PictureMode {

  targetFrame: WritableSignal<string> = signal("");
  prevFrame: string = "";
  nextFrame: string = "";
  isComplete: WritableSignal<boolean> = signal(false);
  mode: WritableSignal<string> = signal('daily');

  targetEpisode: string = "";
  epiNum: string = "";

  incorrectAnswers: string[] = [];
  episodeData: string[] = [];
  englishEpisodeData: string[] = [];


  scaleRatio: WritableSignal<number> = signal(2);
  grayscaleRatio: WritableSignal<number> = signal(1);
  addt: WritableSignal<boolean> = signal(false);

  translationSub!: Subscription;

  title: Title = inject(Title);
  meta: Meta = inject(Meta);
  ls = inject(LocalStorageService);
  ds = inject(DataService);
  ts = inject(TranslateService);
  dialog = inject(MatDialog);
  rand!: Rand;

  constructor(@Inject(PLATFORM_ID) private platformId: object) {

    this.translationSub = this.ts.stream('episodes').subscribe((res) => {
      let arr: string[] = Object.values(res);
      for (let i = 0; i < this.episodeData.length; i++) {
        this.episodeData[i] = this.episodeData[i].substring(0, 7) + arr[i];
      }
    });

    if (isPlatformBrowser(this.platformId)) {
      this.rand = new Rand(this.ls.progress().date! + "picture");
    }

  }

  ngOnInit() {
    this.title.setTitle("Picture | Avatardle");
    this.meta.updateTag({
      name: "description",
      content: "Play Picture Mode on Avatardle, the daily Avatar guessing game. Guess episodes from Avatar: The Last Airbender using frames from the show!"
    });

    this.ds.pictureData$.subscribe((data: Episode) => {

      this.targetEpisode = this.ds.episodes[Math.floor(61 * this.rand.next())];

      let frameIdx = Math.floor(this.rand.next() * data[this.targetEpisode]);
      let prevIdx = String(frameIdx - 1).padStart(3, '0');
      let nextIdx = String(frameIdx + 1).padStart(3, '0');
      let frameStr = String(frameIdx).padStart(3, '0');

      this.targetFrame.set(`${environment.r2AssetUrl}/frames/${encodeURIComponent(this.targetEpisode)}/frame_${frameStr}.webp`);
      this.prevFrame = `${environment.r2AssetUrl}/frames/${encodeURIComponent(this.targetEpisode)}/frame_${prevIdx}.webp`.replace(/'/g, "%27");;
      this.nextFrame = `${environment.r2AssetUrl}/frames/${encodeURIComponent(this.targetEpisode)}/frame_${nextIdx}.webp`.replace(/'/g, "%27");;

      this.englishEpisodeData = [...this.ds.episodes].slice(0, 61);
      this.episodeData = [...this.ds.episodes].slice(0, 61);
      this.epiNum = this.targetEpisode.substring(0, 7);

      if (this.ls.progress().picture.complete) {
        this.isComplete.set(true);
      }

      this.setRatios(this.ls.progress().picture.numGuesses);
      setTimeout(() => {
        this.addt.set(true);
      }, 500);

    });
  }


  ngOnDestroy() {
    this.translationSub.unsubscribe();
  }

  onEnter(select: string | undefined) {
    if (!select) return;

    const selectedEpisode = this.toEnglishEpisode(select);

    if (selectedEpisode == this.targetEpisode) {

      this.scaleRatio.set(1);
      this.grayscaleRatio.set(0);

      this.isComplete.set(true);
      this.ls.patch(['picture'], { complete: true, numGuesses: this.ls.progress().picture.numGuesses + 1 });
      this.ds.throwConfetti(this.ls.progress().picture.numGuesses);
      this.ds.updateStats("picture");
    }
    else {

      this.incorrectAnswers.unshift(selectedEpisode);
      this.removeEpisodeOption(selectedEpisode);

      this.ls.patch(['picture', 'numGuesses'], this.ls.progress().picture.numGuesses + 1);
      this.setRatios(this.ls.progress().picture.numGuesses);
    }
  }

  setRatios(numGuesses: number) {

    if (this.isComplete()) {
      this.scaleRatio.set(1);
      this.grayscaleRatio.set(0);
      return;
    }
    this.scaleRatio.set(2 - Math.min(1, numGuesses * 0.2));
    this.grayscaleRatio.set(1 - Math.min(1, numGuesses * 0.2));
  }

  isSurrenderDisabled() {
    return this.isComplete() || this.ls.progress().picture.numGuesses < 6;
  }
  getSurrenderText(): string {
    return getSurrenderText(this.isComplete(), this.ls.progress().picture.numGuesses, 6);
  }
  getTooltipText(hintId: number): string {
    return getHintTooltip(this.isComplete(), this.ls.progress().picture.numGuesses, 2, hintId);
  }
  isEnabled(hintId: number) {
    return this.isComplete() || this.ls.progress().picture.numGuesses >= 2 + hintId;
  }

  private toEnglishEpisode(option: string): string {
    const id = option.substring(0, 6);
    return this.englishEpisodeData.find((name) => name.includes(id))!;
  }

  private removeEpisodeOption(episode: string) {
    const id = episode.substring(0, 6);
    const optionIndex = this.episodeData.findIndex((name) => name.includes(id));
    if (optionIndex >= 0) {
      this.episodeData.splice(optionIndex, 1);
    }
  }

  openDialog(name: string) {
    if (name == "surrender") {
      this.dialog.open(SurrenderDialogComponent, { width: '30vw', maxWidth: 'none', autoFocus: false }).afterClosed().subscribe((res) => {
        if (res == true) {
          this.onEnter(this.targetEpisode);
        }
      });
    }
  }

  setMode(mode: string) {
    if (this.isComplete()) {
      this.mode.set(mode);
    }
  }

  expandImage(imgURL: string, title: string) {

    this.dialog.open(ExpandImageDialogComponent, {
      width: 'clamp(40rem,40vw,40vw)', maxWidth: 'none', panelClass: 'responsive-panel', data: {
        isComplete: true,
        imageUrl: imgURL,
        mode: "picture",
        title: title
      }
    });
  }

}
