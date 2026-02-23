import { afterNextRender, ChangeDetectionStrategy, Component, inject, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService, Episode } from '../services/data.service';
import { TmNgOdometerModule } from 'odometer-ngx';
import { Subscription } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Meta, Title } from '@angular/platform-browser';
import { LocalStorageService } from '../services/local-storage.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { SurrenderDialogComponent } from '../surrender-dialog/surrender-dialog.component';
import Rand from 'rand-seed';
import { environment } from '../../environments/environment';
import { ExpandImageDialogComponent } from '../expand-image-dialog/expand-image-dialog.component';


@Component({
  selector: 'picture',
  imports: [FormsModule, TmNgOdometerModule, AsyncPipe, TranslatePipe, MatTooltipModule],
  templateUrl: './picture.component.html',
  styleUrl: './picture.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PictureMode {

  targetFrame: WritableSignal<string> = signal("");
  prevFrame: string = "";
  nextFrame: string = "";
  isVisible: WritableSignal<boolean> = signal(true);
  isComplete: WritableSignal<boolean> = signal(false);

  targetEpisode: string = "";
  epiNum: string = "";
  searchVal: string = "";
  selected: string = "";

  incorrectAnswers: string[] = [];
  episodeList: string[] = [];
  episodeData: string[] = [];
  englishEpisodeData: string[] = [];


  scaleRatio: WritableSignal<number> = signal(2);
  grayscaleRatio: WritableSignal<number> = signal(1);
  modelKey: string | null = null;
  addt: WritableSignal<boolean> = signal(false);

  translationSub!: Subscription;

  title: Title = inject(Title);
  meta: Meta = inject(Meta);
  ls = inject(LocalStorageService);
  ds = inject(DataService);
  ts = inject(TranslateService);
  dialog = inject(MatDialog);
  isBrowser = (typeof window != "undefined");
  rand!: Rand;

  constructor(private route: ActivatedRoute) {

    this.translationSub = this.ts.stream('episodes').subscribe((res) => {
      let arr: string[] = Object.values(res);
      for (let i = 0; i < this.episodeData.length; i++) {
        this.episodeData[i] = this.episodeData[i].substring(0, 7) + arr[i];
      }
    });

    if (this.isBrowser) {
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

      this.targetFrame.set(`${environment.R2Url}/frames/${encodeURIComponent(this.targetEpisode)}/frame_${frameStr}.webp`);
      this.prevFrame = `${environment.R2Url}/frames/${encodeURIComponent(this.targetEpisode)}/frame_${prevIdx}.webp`;
      this.nextFrame = `${environment.R2Url}/frames/${encodeURIComponent(this.targetEpisode)}/frame_${nextIdx}.webp`;

      this.englishEpisodeData = [...this.ds.episodes].slice(0, 61);
      this.episodeData = [...this.ds.episodes].slice(0, 61);
      this.epiNum = this.targetEpisode.substring(0, 7);

      if (this.ls.progress().picture.complete) {
        this.isComplete.set(true);
        this.modelKey = this.modelKey = "episodes." + this.targetEpisode;
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

  onInput(event: Event) {

    this.searchVal = (event.target as HTMLInputElement).value;
    this.episodeList = this.episodeData.filter(epi => epi.toLowerCase().includes(this.searchVal.toLowerCase()) && this.searchVal != "");
    this.selected = this.episodeList.length == 0 ? "" : this.episodeList[0];
  }

  onEnter(select: string = "") {

    if (select != "") {
      this.selected = select;
    }
    if (this.selected != "") {
      let id = this.selected.substring(0, 6);
      this.selected = this.englishEpisodeData.find((name) => name.includes(id))!;
    }

    if (this.selected == this.targetEpisode) {

      this.modelKey = "episodes." + this.targetEpisode;

      this.scaleRatio.set(1);
      this.grayscaleRatio.set(0);

      this.isComplete.set(true);

      this.ls.patch(['picture'], { complete: true, numGuesses: this.ls.progress().picture.numGuesses + 1 });

      this.ds.throwConfetti(this.ls.progress().picture.numGuesses);
      this.ds.updateStats("picture");
    }
    else if (this.selected != "") {

      this.incorrectAnswers.unshift(this.selected!);
      this.searchVal = "";
      this.episodeList = [];
      this.episodeData.splice(this.episodeData.indexOf(this.selected), 1);
      this.selected = "";

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

    let diff = 6 - this.ls.progress().picture.numGuesses;
    if (diff <= 0 || this.isComplete()) {
      return "Reveal answer";
    }
    else if (diff == 1) {
      return "Reveal answer in 1 more guess";
    }
    return `Reveal answer in ${diff} more guesses`;
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

  expandImage(imgURL: string, title: string) {

    this.dialog.open(ExpandImageDialogComponent, {
      width: '40vw', maxWidth: 'none', panelClass: 'responsive-panel', data: {
        isComplete: true,
        imageUrl: imgURL,
        mode: "picture",
        title: title
      }
    });
  }

  getTooltipText(hintId: number): string {

    let diff = hintId + 2 - this.ls.progress().picture.numGuesses;
    if (diff <= 0 || this.isComplete()) {
      return "Hint available!";
    }
    else if (diff == 1) {
      return "Hint in 1 more guess";
    }
    return `Hint in ${diff} more guesses`;
  }

  isEnabled(hintId: number) {

    return this.isComplete() || this.ls.progress().picture.numGuesses >= 2 + hintId;
  }

}