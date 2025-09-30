import { afterNextRender, Component, inject, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Rand from 'rand-seed';
import { DailyStats, DataService } from '../services/data.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { HintDialogComponent } from '../hint-dialog/hint-dialog.component';
import { TmNgOdometerModule } from 'odometer-ngx';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { HyphenatePipe } from '../pipes/hyphenate.pipe';
import { CountdownComponent } from 'ngx-countdown';
import { TranslatePipe } from '@ngx-translate/core';
import { Meta, Title } from '@angular/platform-browser';
import { LocalStorageService } from '../services/local-storage.service';

@Component({
    selector: 'quote',
    imports: [FormsModule, MatTooltipModule, TmNgOdometerModule, AsyncPipe, HyphenatePipe, CountdownComponent, TranslatePipe],
    templateUrl: './quote.component.html',
    styleUrl: './quote.component.css'
})

export class QuoteMode {

    quote = signal('');

    target: string = "";
    incorrectAnswers: string[] = [];

    charList: string[] = [];
    searchVal: string = "";
    isVisible: boolean = true;
    selected: string = "";
    characterData: string[] = [];

    isComplete: WritableSignal<boolean> = signal(false);

    ls: LocalStorageService = inject(LocalStorageService);
    title: Title = inject(Title);
    meta: Meta = inject(Meta);
    $stat!: Observable<DailyStats>;
    isBrowser = (typeof window != "undefined");
    hints: { title: string, quote: string }[] = [];

    constructor(private ds: DataService, private dialog: MatDialog) {

        afterNextRender(() => {

            this.$stat = this.ds.stats$;
            this.characterData = this.ds.getQuoteCharacterData();

            let rand = new Rand(this.ls.progress.date! + "quote");
            let idx = this.ds.quoteIndices[Math.floor(rand.next() * this.ds.quoteIndices.length)];
            if (this.ls.progress.quote.complete) {
                this.isComplete.set(true);
                this.searchVal = "-" + this.ls.progress.quote.target;
            }

            this.ds.transcript$.subscribe((data) => {

                this.target = data[idx].Character;
                this.quote.set(data[idx].script);
                this.hints = [
                    { title: "Previous Line", quote: data[idx - 1].script },
                    { title: "Next Line", quote: data[idx + 1].script },
                    { title: "Episode Name", quote: this.ds.episodes[data[idx].total_number - 1] }
                ];
            });

        });
    }

    ngOnInit() {
        this.title.setTitle("Avatardle - Quote");
        this.meta.updateTag({
            name: "description",
            content: "Guess which character from Avatar: The Last Airbender said this quote!"
        });
    }

    onInput() {

        this.charList = this.characterData.filter(char => char.toLowerCase().includes(this.searchVal.toLowerCase()) && this.searchVal != "");
        this.selected = this.charList.length == 0 ? "" : this.charList[0];
    }

    onEnter(select: string = "") {

        if (select != "") {
            this.selected = select;
        }
        if (this.selected == this.target) {

            this.searchVal = "-" + this.target;
            let guesses = this.ls.progress.quote.numGuesses + 1;
            this.isComplete.set(true);
            this.ls.progress.quote = { complete: true, target: this.target, numGuesses: guesses };
            this.ls.update();
            this.ds.throwConfetti(this.ls.progress.quote.numGuesses);
            this.ds.updateStats("quote");

        }
        else if (this.selected != "") {

            let char = this.characterData.find(char => char == this.selected);
            this.incorrectAnswers.unshift(char!);
            this.searchVal = "";
            this.charList = [];
            this.characterData.splice(this.characterData.indexOf(char!), 1)
            this.ls.progress.quote.numGuesses++;
            this.ls.update();

        }
    }

    isEnabled(hintId: number) {

        return this.isComplete() || this.ls.progress.quote.numGuesses >= 2 + hintId;
    }

    showHint(hintId: number) {

        this.dialog.open(HintDialogComponent, {
            width: '50vw', maxWidth: 'none', panelClass: 'responsive-panel', data: {
                title: this.hints[hintId].title,
                quote: this.hints[hintId].quote
            }
        });
    }

    getTooltipText(hintId: number): string {
        
        let diff = hintId + 2 - this.ls.progress.quote.numGuesses;
        if (diff <= 0 || this.isComplete()) {
            return "Hint available!";
        }
        else if (diff == 1) {
            return "Hint in 1 more guess";
        }
        return `Hint in ${diff} more guesses`;
    }

    getCountdownConfig() {
        return this.ds.getCountdownConfig();
    }
}


