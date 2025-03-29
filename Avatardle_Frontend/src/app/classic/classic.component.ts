import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Rand, { PRNG } from 'rand-seed';
import { tileData } from '../tile/tile.component';
import { TileComponent } from '../tile/tile.component';
import { Character, DailyStats, DataService } from '../services/data.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TmNgOdometerModule } from 'odometer-ngx';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { AvatardleProgress } from '../app.component';

@Component({
    selector: 'classic',
    imports: [FormsModule, TileComponent, MatTooltipModule, TmNgOdometerModule, AsyncPipe],
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

    constructor(private ds: DataService) { }

    ngOnInit() {

        this.$stat = this.ds.$stats;
        this.characterData = this.ds.getClassicCharacterData();
        this.targetChar = this.characterData[Math.floor(this.rand.next() * this.characterData.length)];

        if (this.progress.classic.complete) {
            this.searchVal = this.progress.classic.target;
        }
        this.tileArray = this.progress.classic.guesses;
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

            let idx = 1.086957 * char.index; // 1/(num images - 1)
            let numCorrect: number = 0;

            let tmp: tileData[] = [{ imageIndex: idx, name: char.name }];

            Object.entries(char).forEach(([key, val], index) => {

                let tileData: tileData = { isCorrect: false, backgroundPosition: `${index * 20}% 0`, delay: 800 * (index - 1), hasTransition: true };
                let targetVal:any = this.targetChar![key as keyof Character];

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
                            tileData.imageUrl = `images/elements/${val.toLowerCase()}.webp`;
                            tileData.element = val;
                        }
                        else {
                            tileData.text = val;
                        }
                        break;
                    case "affiliations":

                        tileData.affiliations = val.sort(() => 0.5 - this.rand.next()).slice(0, 3);

                        let count = 0;
                        for(let aff of tileData.affiliations!){
                            if(targetVal.includes(aff)){
                                count++;
                            }
                        }
                        if(count == 0){
                            tileData.isCorrect = false;
                        }
                        else if(count < tileData.affiliations!.length){
                            tileData.isCorrect = undefined;
                        }
                        else{
                            tileData.isCorrect = true;
                        }
                        break;

                    case "firstAppearance":

                        let episodeName = val.substring(6);
                        tileData.episodeName = episodeName;

                        if (!tileData.isCorrect) {
                            let vals = parseInt(val.substring(1, 3)) * 100 + parseInt(val.substring(4, 6));
                            let t = targetVal as string;
                            let target = parseInt(t.substring(1, 3)) * 100 + parseInt(t.substring(4, 6));
                            tileData.arrowDir = (target < vals) ? "none" : "rotate(180deg)";
                            tileData.imageUrl = `images/down-arrow.png`;
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

        }
    }
}
