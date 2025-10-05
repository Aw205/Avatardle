import { afterNextRender, ChangeDetectionStrategy, Component, inject, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../services/data.service';
import { TmNgOdometerModule } from 'odometer-ngx';
import { Subscription } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Meta, Title } from '@angular/platform-browser';
import { LocalStorageService } from '../services/local-storage.service';

@Component({
  selector: 'picture',
  imports: [FormsModule, TmNgOdometerModule, AsyncPipe, TranslatePipe],
  templateUrl: './picture.component.html',
  styleUrl: './picture.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PictureMode {

  targetFrame: WritableSignal<string> = signal("");
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
  isBrowser = (typeof window != "undefined");


  constructor(private route: ActivatedRoute) {

    this.translationSub = this.ts.stream('episodes').subscribe((res) => {
      let arr: string[] = Object.values(res);
      for (let i = 0; i < this.episodeData.length; i++) {
        this.episodeData[i] = this.episodeData[i].substring(0, 7) + arr[i];
      }
    });

    afterNextRender(() => {

      this.targetFrame.set(this.route.snapshot.data["image"].frame);
      this.englishEpisodeData = [...this.ds.episodes].slice(0, 61);
      this.episodeData = [...this.ds.episodes].slice(0, 61);
      this.targetEpisode = this.route.snapshot.data["image"].target;
      this.epiNum = this.targetEpisode.substring(0, 7);

      if (this.ls.progress.picture.complete) {
        this.isComplete.set(true);
        this.modelKey = this.modelKey = "episodes." + this.ls.progress.picture.target;
      }

      this.setRatios(this.ls.progress.picture.numGuesses);
      setTimeout(() => {
        this.addt.set(true);
      }, 500);

    })
  }

  ngOnInit() {
    this.title.setTitle("Avatardle - Picture");
    this.meta.updateTag({
      name: "description",
      content: "Guess the episode name by looking at a frame from an episode of Avatar: The Last Airbender."
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
      this.ls.progress.picture.numGuesses++;
      this.ds.throwConfetti(this.ls.progress.picture.numGuesses);

      this.isComplete.set(true);
      this.ls.progress.picture.complete = true;
      this.ls.progress.picture.target = this.targetEpisode;
      this.ls.update();
      this.ds.updateStats("picture");
    }
    else if (this.selected != "") {

      this.incorrectAnswers.unshift(this.selected!);
      this.searchVal = "";
      this.episodeList = [];
      this.episodeData.splice(this.episodeData.indexOf(this.selected), 1);
      this.selected = "";

      this.ls.progress.picture.numGuesses++;
      this.ls.update();
      this.setRatios(this.ls.progress.picture.numGuesses);

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

}