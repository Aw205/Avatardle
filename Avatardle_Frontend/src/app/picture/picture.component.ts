import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Rand, { PRNG } from 'rand-seed';
import { DailyStats, DataService } from '../services/data.service';
import { TmNgOdometerModule } from 'odometer-ngx';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { AvatardleProgress } from '../app.component';

@Component({
  selector: 'picture',
  imports: [FormsModule, TmNgOdometerModule, AsyncPipe],
  templateUrl: './picture.component.html',
  styleUrl: './picture.component.css'
})
export class PictureMode {

  targetFrame: string = "";
  targetEpisode: string = "";
  incorrectAnswers: string[] = [];
  episodeList: string[] = [];
  episodeData: string[] = [];
  searchVal: string = "";
  isVisible: boolean = true;
  selected: string = "";

  scaleRatio: number = 2;
  grayscaleRatio: number = 1;

  addt: boolean = false;

  $stat!: Observable<DailyStats>;
  progress: AvatardleProgress = JSON.parse(localStorage.getItem("avatardle_progress")!);

  constructor(private ds: DataService) { }


  ngOnInit() {

    this.$stat = this.ds.$stats;
    if (this.progress.picture.complete) {
      this.searchVal = this.progress.picture.target;
    }

    this.setRatios(this.progress.picture.numGuesses);

    setTimeout(() => {
      this.addt = true;
    }, 500);

    this.ds.getEpisodeData().subscribe((data) => {

      let keys = Object.keys(data);
      let rand = new Rand(this.progress.date! + "picture");
      this.targetEpisode = keys[Math.floor(keys.length * rand.next()) << 0];
      let frameIdx = rand.next() * this.targetEpisode.length << 0;
      this.targetFrame = `randomframes/${data[this.targetEpisode][frameIdx]}`;

      for (let name of keys) {
        this.episodeData.push(name);
      }
    });
  }

  onInput() {

    this.episodeList = this.episodeData.filter(epi => epi.toLowerCase().includes(this.searchVal.toLowerCase()) && this.searchVal != "");
    this.selected = this.episodeList.length == 0 ? "" : this.episodeList[0];
  }

  onEnter(select: string = "") {

    if (select != "") {
      this.selected = select;
    }

    if (this.selected == this.targetEpisode) {

      this.scaleRatio = 1;
      this.grayscaleRatio = 0;
      this.progress.picture.numGuesses++;
      this.ds.throwConfetti(this.progress.picture.numGuesses);

      this.progress.picture.complete = true;
      this.progress.picture.target = this.targetEpisode;

      this.searchVal = this.targetEpisode;
      localStorage.setItem("avatardle_progress", JSON.stringify(this.progress));
      this.ds.updateStats("picture");
    }
    else if (this.selected != "") {

      this.incorrectAnswers.unshift(this.selected!);
      this.progress.picture.numGuesses++;

      this.setRatios(this.progress.picture.numGuesses);
      this.searchVal = "";
      this.episodeList = [];

      this.episodeData.splice(this.episodeData.indexOf(this.selected), 1);

      localStorage.setItem("avatardle_progress", JSON.stringify(this.progress));
    }
  }

  setRatios(numGuesses: number) {

    if (this.progress.picture.complete) {
      [this.scaleRatio, this.grayscaleRatio] = [1, 0];
      return;
    }
    this.scaleRatio = 2 - Math.min(1, numGuesses * 0.2);
    this.grayscaleRatio = 1 - Math.min(1, numGuesses * 0.2);

  }

}


