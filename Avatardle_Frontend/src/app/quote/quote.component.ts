import { Component, DestroyRef, Inject, inject, PLATFORM_ID, signal, viewChild, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Rand from 'rand-seed';
import { DataService } from '../services/data.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { HintDialogComponent, QuoteHintData } from '../hint-dialog/hint-dialog.component';
import { AsyncPipe, isPlatformBrowser } from '@angular/common';
import { HyphenatePipe } from '../pipes/hyphenate.pipe';
import { CountdownComponent } from 'ngx-countdown';
import { TranslatePipe } from '@ngx-translate/core';
import { Meta, Title } from '@angular/platform-browser';
import { LocalStorageService } from '../services/local-storage.service';
import { ShareResultsComponent } from '../share-results/share-results.component';
import { SurrenderDialogComponent } from '../surrender-dialog/surrender-dialog.component';
import { getSurrenderText, isSurrenderDisabled } from '../game-mode-utils';
import { QuoteBlitzComponent } from '../quote-blitz/quote-blitz.component';
import { DigitFlowComponent } from 'ngx-digit-flow';
import { LeaderboardService } from '../services/leaderboard.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../services/auth.service';
import { SearchSelectComponent } from '../search-select/search-select.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'quote',
    imports: [FormsModule, MatTooltipModule, MatMenuModule, AsyncPipe, HyphenatePipe, CountdownComponent, TranslatePipe, ShareResultsComponent, DigitFlowComponent, QuoteBlitzComponent, SearchSelectComponent],
    templateUrl: './quote.component.html',
    styleUrls: ['./quote.component.css', './quote-card.css']
})

export class QuoteMode {

    mode: WritableSignal<string> = signal('daily');
    quote: WritableSignal<string> = signal('');
    target: WritableSignal<string> = signal('');
    isComplete: WritableSignal<boolean> = signal(false);

    characterData: string[] = [];
    hints: QuoteHintData[] = [];
    readonly hintUnlockVersion = signal(0);
    private readonly hintMenuTrigger = viewChild(MatMenuTrigger);
    private readonly destroyRef = inject(DestroyRef);
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

            const rand = new Rand(this.ls.progress().date! + "quote");
            const char = Object.keys(this.ds.quoteIndices)[Math.floor(rand.next() * Object.keys(this.ds.quoteIndices).length)];
            const idxArr = this.ds.quoteIndices[char];
            const idx = idxArr[Math.floor(rand.next() * idxArr.length)];

            this.isComplete.set(this.ls.progress().quote.complete);

            this.as.getMe().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data) => {
                this.usernameInput.set(data.username);
                this.inputDisabled.set(true);
            });

            this.ds.transcript$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data) => {

                this.target.set(data[idx].Character);
                this.quote.set(data[idx].script);
                this.hints = [
                    { kind: 'previous', quote: data[idx - 1].script },
                    { kind: 'next', quote: data[idx + 1].script },
                    { kind: 'episode', quote: this.ds.episodes[data[idx].total_number - 1] }
                ];

                if (this.ls.progress().quote.complete) {
                    this.submittedToLeaderboard.set(this.ls.progress().quote.leaderboardUsername != undefined);
                    this.usernameInput.set(this.ls.progress().quote.leaderboardUsername || '');
                }
            });
        }
    }

    onEnter(select: string | undefined) {

        if (!select || this.isComplete() || this.guesses.includes(select)) return;
        const previouslyAvailable = this.availableHintCount;
        this.guesses.unshift(select);
        if (select == this.target()) {
            this.isComplete.set(true);
            this.ls.patch(['quote'], { complete: true, guesses: this.guesses });
            this.ds.throwConfetti(this.guesses.length);
            this.ds.updateStats("quote");
        } else {
            this.characterData = this.characterData.filter(character => character !== select);
            this.ls.patch(['quote', 'guesses'], this.guesses);
        }
        this.highlightNewHints(previouslyAvailable);
    }

    get availableHintCount(): number {
        return this.hints.filter((_, index) => this.isEnabled(index)).length;
    }

    remainingHintGuesses(hintId: number): number {
        return this.isEnabled(hintId) ? 0 : 2 + hintId - this.guesses.length;
    }

    private highlightNewHints(previousCount: number) {
        if (this.availableHintCount > previousCount) {
            this.hintUnlockVersion.update(version => version + 1);
        }
    }

    isEnabled(hintId: number) {

        return this.isComplete() || this.guesses.length >= 2 + hintId;
    }

    showHint(hintId: number) {
        if (!this.hints[hintId] || !this.isEnabled(hintId)) {
            return;
        }
        this.dialog.open(HintDialogComponent, {
            panelClass: 'quote-hint-dialog', autoFocus: false, restoreFocus: false, data: this.hints[hintId]
        }).afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.hintMenuTrigger()?.focus());
    }

    getSurrenderText(): string {
        return getSurrenderText(this.isComplete(), this.guesses.length, 5);
    }
    isSurrenderDisabled() {
        return isSurrenderDisabled(this.isComplete(), this.guesses.length, 5);
    }
    openSurrenderDialog() {
        this.dialog.open(SurrenderDialogComponent, {
            width: '30vw', maxWidth: 'none', autoFocus: false
        }).afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
            if (result === true) this.onEnter(this.target());
        });
    }

    setMode(mode: string) {
        if(this.isComplete()){
            this.mode.set(mode);
        }
    }

    submitToLeaderboard() {

        this.leaderboardService.updateLeaderboard(this.usernameInput().trim(),"quote", this.guesses).subscribe({
            error: () => {
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
