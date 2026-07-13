import { Component, computed, Inject, inject, PLATFORM_ID, Signal, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Rand from 'rand-seed';
import { DataService } from '../services/data.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { HintDialogComponent } from '../hint-dialog/hint-dialog.component';
import { AsyncPipe, isPlatformBrowser } from '@angular/common';
import { HyphenatePipe } from '../pipes/hyphenate.pipe';
import { CountdownComponent } from 'ngx-countdown';
import { TranslatePipe } from '@ngx-translate/core';
import { Meta, Title } from '@angular/platform-browser';
import { LocalStorageService } from '../services/local-storage.service';
import { ShareResultsComponent } from '../share-results/share-results.component';
import { SurrenderDialogComponent } from '../surrender-dialog/surrender-dialog.component';
import { getSurrenderText, isSurrenderDisabled, getHintTooltip } from '../game-mode-utils';
import { QuoteBlitzComponent } from '../quote-blitz/quote-blitz.component';
import { DigitFlowComponent } from 'ngx-digit-flow';
import { LeaderboardService } from '../services/leaderboard.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../services/auth.service';

@Component({
    selector: 'quote',
    imports: [FormsModule, MatTooltipModule, AsyncPipe, HyphenatePipe, CountdownComponent, TranslatePipe, ShareResultsComponent, DigitFlowComponent,QuoteBlitzComponent],
    templateUrl: './quote.component.html',
    styleUrl: './quote.component.css'
})

export class QuoteMode {

    mode: WritableSignal<string> = signal('daily');
    quote: WritableSignal<string> = signal('');
    target: WritableSignal<string> = signal('');
    isComplete: WritableSignal<boolean> = signal(false);
    isVisible: WritableSignal<boolean> = signal(false);
    searchVal: WritableSignal<string> = signal('');
    transcript: any[] = [];

    charList: Signal<string[]> = computed(() => {
        let val = this.searchVal().toLowerCase();
        return this.characterData.filter(char => val != '' && char.toLowerCase().includes(val));
    });
    characterData: string[] = [];
    hints: { title: string, quote: string }[] = [];
    guesses: string[] = [];
    usernameInput: WritableSignal<string> = signal('');
    inputDisabled: WritableSignal<boolean> = signal(false);
    
    ls = inject(LocalStorageService);
    title = inject(Title);
    meta = inject(Meta);
    ds = inject(DataService);
    as = inject(AuthService);
    dialog = inject(MatDialog);
    private leaderboardService = inject(LeaderboardService);
    snackBar = inject(MatSnackBar);
    submittedToLeaderboard: WritableSignal<boolean> = signal(false);
    usernameError: WritableSignal<boolean> = signal(false);

    constructor(@Inject(PLATFORM_ID) private platformId: object) { }

    ngOnInit() {
        this.title.setTitle("Quote | Avatardle");
        this.meta.updateTag({
            name: "description",
            content: "Play Quote Mode on Avatardle, the daily Avatar guessing game. Guess various quotes from Avatar: The Last Airbender!"
        });
        if (isPlatformBrowser(this.platformId)) {
            this.guesses = this.ls.progress().quote.guesses;
            this.characterData = this.ds.getQuoteCharacterData().filter((e) => !this.guesses.includes(e));

            let rand = new Rand(this.ls.progress().date! + "quote");
            let char = Object.keys(this.ds.quoteIndices)[Math.floor(rand.next() * Object.keys(this.ds.quoteIndices).length)];
            let idxArr = this.ds.quoteIndices[char];
            let idx = idxArr[Math.floor(rand.next() * idxArr.length)];

            this.isComplete.set(this.ls.progress().quote.complete);

            this.as.getMe().subscribe((data) => {
                this.usernameInput.set(data.username);
                this.inputDisabled.set(true);
            });

            this.ds.transcript$.subscribe((data) => {

                this.transcript = data;
                this.target.set(data[idx].Character);
                this.quote.set(data[idx].script);
                this.hints = [
                    { title: "Previous Line", quote: data[idx - 1].script },
                    { title: "Next Line", quote: data[idx + 1].script },
                    { title: "Episode Name", quote: this.ds.episodes[data[idx].total_number - 1] }
                ];

                if (this.ls.progress().quote.complete) {
                    this.searchVal.set(this.target());
                    this.submittedToLeaderboard.set(this.ls.progress().quote.leaderboardUsername != undefined);
                    this.usernameInput.set(this.ls.progress().quote.leaderboardUsername || '');
                }
            });
        }
    }

    onEnter(select: string | undefined) {

        if (!select) return;
        if (select == this.target()) {
            this.searchVal.set(this.target());
            this.isComplete.set(true);
            this.ls.patch(['quote'], { complete: true, guesses: this.guesses });
            this.ds.throwConfetti(this.guesses.length);
            this.ds.updateStats("quote");
            return;
        }
        this.guesses.unshift(select);
        this.searchVal.set('');
        this.characterData.splice(this.characterData.indexOf(select), 1);
        this.ls.patch(['quote', 'guesses'], this.guesses);
    }

    isEnabled(hintId: number) {

        return this.isComplete() || this.guesses.length >= 2 + hintId;
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
        return getHintTooltip(this.isComplete(), this.guesses.length, 2, hintId);
    }
    getSurrenderText(): string {
        return getSurrenderText(this.isComplete(), this.guesses.length, 5);
    }
    isSurrenderDisabled() {
        return this.isComplete() || this.guesses.length < 5;
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

    setMode(mode: string) {
        if(this.isComplete()){
            this.mode.set(mode);
        }
    }

    submitToLeaderboard() {

        this.leaderboardService.updateLeaderboard(this.usernameInput().trim(),"quote", this.guesses).subscribe({
            error: (err) => {
                this.usernameError.set(true);
            },
            complete: () => {
                this.snackBar.open("Submitted!", undefined, { panelClass: "snack-bar", duration: 4000 });
                this.submittedToLeaderboard.set(true);
                this.ls.patch(['quote', 'leaderboardUsername'], this.usernameInput());
            },
        });
    }


}


