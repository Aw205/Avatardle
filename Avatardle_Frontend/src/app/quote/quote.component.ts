import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Rand, { PRNG } from 'rand-seed';
import { Character, DailyStats, DataService } from '../services/data.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { HintDialogComponent } from '../hint-dialog/hint-dialog.component';
import { TmNgOdometerModule } from 'odometer-ngx';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { AvatardleProgress } from '../app.component';

@Component({
    selector: 'quote',
    imports: [FormsModule, MatTooltipModule, TmNgOdometerModule, AsyncPipe],
    templateUrl: './quote.component.html',
    styleUrl: './quote.component.css'
})

export class QuoteMode {

    quote: string = "";
    target: string = "";
    incorrectAnswers: Character[] = [];

    charList: Character[] = [];
    searchVal: string = "";
    isVisible: boolean = true;
    selected: string = "";
    characterData: Character[] = [];

    quoteIndex: number = 0;
    prevQuote: string = "";
    nextQuote: string = "";
    quoteEpisode: string = "";

    $stat!: Observable<DailyStats>;
    progress: AvatardleProgress = JSON.parse(localStorage.getItem("avatardle_progress")!);

    constructor(private ds: DataService, private dialog: MatDialog) { }

    ngOnInit() {

        this.$stat = this.ds.$stats;
        this.characterData = this.ds.getQuoteCharacterData();

        let rand = new Rand(this.progress.date! + "quote");
        let idx = this.ds.quoteIndices[Math.floor(rand.next() * this.ds.quoteIndices.length)];

        this.prevQuote = this.ds.transcript[idx - 1].script;
        this.nextQuote = this.ds.transcript[idx + 1].script;

        this.quote = this.ds.transcript[idx].script;
        this.target = this.ds.transcript[idx].Character;

        this.ds.getEpisodeData().subscribe((epiData) => {
            let keys = Object.keys(epiData);
            this.quoteEpisode = keys[this.ds.transcript[idx].total_number];
        });

        if (this.progress.quote.complete) {
            this.searchVal = "-" + this.progress.quote.target;
        }
    }

    onInput() {

        this.charList = this.characterData.filter(char => char.name.toLowerCase().includes(this.searchVal.toLowerCase()) && this.searchVal != "");
        this.selected = this.charList.length == 0 ? "" : this.charList[0].name;
    }

    onEnter(select: string = "") {

        if (select != "") {
            this.selected = select;
        }
        if (this.selected == this.target) {
            this.searchVal = "-" + this.target;
            this.progress.quote.complete = true;
            this.progress.quote.target = this.target;
            this.progress.quote.numGuesses++;

            this.ds.throwConfetti(0);
            this.ds.updateStats("quote");

            localStorage.setItem("avatardle_progress", JSON.stringify(this.progress));

        }
        else if (this.selected != "") {
            let char = this.characterData.find(char => char.name == this.selected);
            this.incorrectAnswers.unshift(char!);
            this.searchVal = "";
            this.charList = [];
            this.characterData.splice(this.characterData.indexOf(char!), 1)

            this.progress.quote.numGuesses++;

            localStorage.setItem("avatardle_progress", JSON.stringify(this.progress));

        }
    }

    isEnabled(threshold: number) {

        return this.progress.quote.complete || (this.progress.quote.numGuesses > threshold);
    }

    showHint(hintId: number) {

        let hints = [
            { title: "Previous Line", quote: this.prevQuote },
            { title: "Next Line", quote: this.nextQuote },
            { title: "Episode Name", quote: this.quoteEpisode }
        ];
        this.dialog.open(HintDialogComponent, {
            width: '50vw', maxWidth: 'none', panelClass:'responsive-panel' ,data: {
                title: hints[hintId].title,
                quote: hints[hintId].quote
            }
        });
    }

    getTooltipText(threshold: number): string {

        let diff = threshold - this.progress.quote.numGuesses;
        if (diff <= 0 || this.progress.quote.complete) {
            return "Hint available!";
        }
        else if (diff == 1) {
            return "Hint in 1 more guess";
        }
        return `Hint in ${diff} more guesses`;
    }
}


