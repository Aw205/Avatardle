import { afterNextRender, ChangeDetectionStrategy, Component, computed, inject, Signal, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Rand from 'rand-seed';
import { DataService } from '../services/data.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { HintDialogComponent } from '../hint-dialog/hint-dialog.component';
import { TmNgOdometerModule } from 'odometer-ngx';
import { AsyncPipe } from '@angular/common';
import { HyphenatePipe } from '../pipes/hyphenate.pipe';
import { CountdownComponent } from 'ngx-countdown';
import { TranslatePipe } from '@ngx-translate/core';
import { Meta, Title } from '@angular/platform-browser';
import { LocalStorageService } from '../services/local-storage.service';
import { ShareResultsComponent } from '../share-results/share-results.component';
import {SurrenderDialogComponent } from '../surrender-dialog/surrender-dialog.component';

@Component({
    selector: 'quote',
    imports: [FormsModule, MatTooltipModule, TmNgOdometerModule, AsyncPipe, HyphenatePipe, CountdownComponent, TranslatePipe, ShareResultsComponent],
    templateUrl: './quote.component.html',
    styleUrl: './quote.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class QuoteMode {

    quote: WritableSignal<string> = signal('');
    target: WritableSignal<string> = signal('');
    isComplete: WritableSignal<boolean> = signal(false);
    isVisible: WritableSignal<boolean> = signal(true);
    searchVal: WritableSignal<string> = signal('');

    charList: Signal<string[]> = computed(() => {
        let val = this.searchVal().toLowerCase();
        return this.characterData.filter(char => val != '' && char.toLowerCase().includes(val));
    });
    characterData: string[] = [];
    hints: { title: string, quote: string }[] = [];
    guesses: string[] = [];

    ls = inject(LocalStorageService);
    title = inject(Title);
    meta = inject(Meta);
    ds = inject(DataService);
    dialog = inject(MatDialog);
    isBrowser = (typeof window != "undefined");


    constructor() {

        afterNextRender(() => {

            this.guesses = this.ls.progress().quote.guesses;
            this.characterData = this.ds.getQuoteCharacterData().filter((e) => !this.guesses.includes(e));
            
            let rand = new Rand(this.ls.progress().date! + "quote");
            let char = Object.keys(this.ds.quoteIndices)[Math.floor(rand.next() * Object.keys(this.ds.quoteIndices).length)];
            let idxArr = this.ds.quoteIndices[char];
            let idx = idxArr[Math.floor(rand.next() * idxArr.length)];
            
            this.isComplete.set(this.ls.progress().quote.complete);

            this.ds.transcript$.subscribe((data) => {

                this.target.set(data[idx].Character);
                this.quote.set(data[idx].script);
                this.hints = [
                    { title: "Previous Line", quote: data[idx - 1].script },
                    { title: "Next Line", quote: data[idx + 1].script },
                    { title: "Episode Name", quote: this.ds.episodes[data[idx].total_number - 1] }
                ];

                if (this.ls.progress().quote.complete) {
                    this.searchVal.set("-" + this.target());
                }
            });

        });
    }

    ngOnInit() {
        this.title.setTitle("Quote | Avatardle");
        this.meta.updateTag({
            name: "description",
            content: "Play Quote Mode on Avatardle, the daily Avatar guessing game. Guess various quotes from Avatar: The Last Airbender!"
        });
    }

    onEnter(select: string | undefined) {

        if (select == this.target()) {

            this.searchVal.set("-" + this.target());
            this.isComplete.set(true);
            this.ls.patch(['quote'], { complete: true, guesses: this.guesses});
            this.ds.throwConfetti(this.guesses.length);
            this.ds.updateStats("quote");

        }
        else if (select != undefined) {

            this.guesses.unshift(select);
            this.searchVal.set('');
            this.characterData.splice(this.characterData.indexOf(select), 1);
            this.ls.patch(['quote', 'guesses'], this.guesses);
        }
    }

    isEnabled(hintId: number) {

        return this.isComplete() || this.guesses.length >= 2 + hintId;
    }
    
    isSurrenderDisabled() {

        return this.isComplete() || this.guesses.length < 5;
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

        let diff = hintId + 2 - this.guesses.length;
        if (diff <= 0 || this.isComplete()) {
            return "Hint available!";
        }
        else if (diff == 1) {
            return "Hint in 1 more guess";
        }
        return `Hint in ${diff} more guesses`;
    }

    getSurrenderText(): string {

        let diff = 5 - this.guesses.length;
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
                    this.onEnter(this.target());
                }
            });
        }
    }
}


