import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Rand, { PRNG } from 'rand-seed';
import { tileData } from '../tile/tile.component';
import { TileComponent } from '../tile/tile.component';
import { Character, DailyStats, DataService, FanArt } from '../services/data.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TmNgOdometerModule } from 'odometer-ngx';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { AvatardleProgress } from '../app.component';
import { HyphenatePipe } from '../pipes/hyphenate.pipe';
import { MatDialog } from '@angular/material/dialog';
import { ClassicSettingsDialogComponent } from '../classic-settings-dialog/classic-settings-dialog.component';
import {CountdownComponent} from 'ngx-countdown'

@Component({
    selector: 'classic',
    imports: [FormsModule, TileComponent, MatTooltipModule, TmNgOdometerModule, AsyncPipe, HyphenatePipe,CountdownComponent],
    templateUrl: './classic.component.html',
    styleUrl: './classic.component.css'
})
export class ClassicMode {


    charList: Character[] = [];
    characterData: Character[] = [];
    searchVal: string = "";
    isVisible: boolean = true;
    selected: string = "";

    guessAttempts: number = 0;

    tileArray: tileData[] = [];
    targetChar!: Character;

    $stat!: Observable<DailyStats>;
    progress: AvatardleProgress = JSON.parse(localStorage.getItem("avatardle_progress")!);
    rand: Rand = new Rand(this.progress.date! + "classic");

    fanArt!: FanArt;
    img!: { pathName: string, artist: { name: string, link: string }, epithet: string };
  

    readonly dialog = inject(MatDialog);
    constructor(private ds: DataService) { }

    ngOnInit() {

        this.$stat = this.ds.stats$;
        this.characterData = this.ds.getClassicCharacterData(this.progress.classic.series);
        this.targetChar = this.characterData[Math.floor(this.rand.next() * this.characterData.length)];

        if (this.progress.classic.complete) {
            this.searchVal = this.progress.classic.target;
        }
        this.tileArray = this.progress.classic.guesses;
        this.guessAttempts = this.tileArray.length/6;

        this.fanArt = this.ds.fanArt.find(e => e.character == this.targetChar.name)!;
        this.img = this.fanArt.images[Math.floor(this.rand.next() * this.fanArt.images.length)];
    }

    onInput() {

        this.charList = this.characterData.filter(char => char.name.toLowerCase().includes(this.searchVal.toLowerCase()) && this.searchVal != "");
        this.selected = this.charList.length == 0 ? "" : this.charList[0].name;
    }

    onEnter(select: string = "") {

        if (select != "") {
            this.selected = select;
        }
        if (this.selected != "") {

            this.guessAttempts++;
            let char = this.characterData.find(char => char.name == this.selected)!;
            let numCorrect: number = 0;

            let tmp: tileData[] = [{ name: char.name }];

            Object.entries(char).forEach(([key, val], index) => {

                let tileData: tileData = { isCorrect: false, backgroundPosition: `${index * 20}% 0`, delay: 800 * (index - 1), hasTransition: true };
                let targetVal: any = this.targetChar![key as keyof Character];

                if (val == targetVal) {
                    tileData.isCorrect = true;
                    numCorrect++;
                }
                switch (key) {
                    case "name":
                        break;
                    case "gender":
                        tileData.text = val;
                        break;
                    case "nationality":
                        tileData.text = val;
                        break;
                    case "bendingElement":

                        if (!["None", "All"].includes(val)) {
                            tileData.imageUrl = `images/elements/${val.toLowerCase()}.svg`;
                            tileData.element = val;
                        }
                        else {
                            tileData.text = val;
                        }
                        break;
                    case "affiliations":

                        tileData.affiliations = val.sort(() => 0.5 - this.rand.next()).slice(0, 3);

                        let count = 0;
                        for (let aff of tileData.affiliations!) {
                            if (targetVal.includes(aff)) {
                                count++;
                            }
                        }
                        if (count == 0) {
                            tileData.isCorrect = false;
                        }
                        else if (count < tileData.affiliations!.length) {
                            tileData.isCorrect = undefined;
                        }
                        else {
                            tileData.isCorrect = true;
                        }
                        break;

                    case "firstAppearance":

                        let episodeName = val.substring(6);
                        tileData.episodeName = episodeName;

                        if (!tileData.isCorrect) {

                            let currIndex = this.ds.episodes.findIndex((episodeName) => episodeName == val);
                            let targetIndex = this.ds.episodes.findIndex((episodeName) => episodeName == targetVal);
                            tileData.arrowDir = (targetIndex < currIndex) ? "none" : "rotate(180deg)";
                            tileData.imageUrl = `images/down-arrow.webp`;
                        }
                        break;
                }
                if (!["name", "index"].includes(key)) {
                    tmp.push(tileData);
                }
            });

            this.tileArray.unshift(...tmp);
            setTimeout(this.checkGuess.bind(this), 800 * 6, numCorrect);
            this.characterData.splice(this.characterData.indexOf(char), 1);

            this.progress.classic.guesses = this.tileArray.map((t) => {
                return { ...t, hasTransition: false, delay: 0 }
            });
            localStorage.setItem("avatardle_progress", JSON.stringify(this.progress));
        }

        this.searchVal = "";
        this.charList = [];

    }

    checkGuess(numCorrect: number) {

        if (numCorrect == 7) {

            this.ds.updateStats("classic");
            this.ds.throwConfetti(this.progress.classic.guesses.length);
            this.searchVal = this.targetChar.name;

            this.progress.classic.target = this.targetChar.name;
            this.progress.classic.complete = true;
            localStorage.setItem("avatardle_progress", JSON.stringify(this.progress));

            setTimeout(() => {
                window.scrollTo({behavior:"smooth",top: document.body.scrollHeight})
            }, 1000);

        }
    }

    openDialog(name: string) {
        if (name == "settings") {
            this.dialog.open(ClassicSettingsDialogComponent, { width: '50vw', maxWidth: 'none' });
        }
    }

    getCountdownConfig(){
        return this.ds.getCountdownConfig();
    }
}
