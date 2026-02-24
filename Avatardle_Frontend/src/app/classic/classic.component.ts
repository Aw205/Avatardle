import { ChangeDetectionStrategy, Component, computed, Inject, inject, PLATFORM_ID, Signal, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Rand, { PRNG } from 'rand-seed';
import { TileComponent, tileData } from '../tile/tile.component';
import { Character, DataService, FanArt } from '../services/data.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TmNgOdometerModule } from 'odometer-ngx';
import { AsyncPipe, isPlatformBrowser } from '@angular/common';
import { HyphenatePipe } from '../pipes/hyphenate.pipe';
import { MatDialog } from '@angular/material/dialog';
import { ClassicSettingsDialogComponent } from '../classic-settings-dialog/classic-settings-dialog.component';
import { CountdownComponent } from 'ngx-countdown'
import { TranslatePipe } from '@ngx-translate/core';
import { Meta, Title } from '@angular/platform-browser';
import { LocalStorageService } from '../services/local-storage.service';
import { ShareResultsComponent } from '../share-results/share-results.component';
import { SurrenderDialogComponent } from '../surrender-dialog/surrender-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../environments/environment';

@Component({
    selector: 'classic',
    imports: [FormsModule, TileComponent, MatTooltipModule, TmNgOdometerModule, AsyncPipe, HyphenatePipe, CountdownComponent, TranslatePipe, ShareResultsComponent],
    templateUrl: './classic.component.html',
    styleUrl: './classic.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClassicMode {

    environment = environment;

    snackBar = inject(MatSnackBar);
    submittedToLeaderboard: WritableSignal<boolean> = signal(false);
    usernameError: WritableSignal<boolean> = signal(false);

    searchVal: WritableSignal<string> = signal('');
    isComplete: WritableSignal<boolean> = signal(false);
    isVisible: WritableSignal<boolean> = signal(false);
    guessAttempts: number = 0;

    targetChar!: Character;
    rand!: Rand;

    fanArt!: FanArt;
    img!: { pathName: string, artist: { name: string, link: string }, epithet: string };

    charList: Signal<Character[]> = computed(() => {
        let val = this.searchVal().toLowerCase();
        return this.characterData.filter(char => val != '' && char.name.toLowerCase().includes(val));
    });
    characterData: Character[] = [];
    tileArray: WritableSignal<tileData[]> = signal([]);

    ls = inject(LocalStorageService);
    title = inject(Title);
    meta = inject(Meta);
    ds = inject(DataService);
    dialog = inject(MatDialog);

    usernameInput: WritableSignal<string> = signal('');

    constructor(@Inject(PLATFORM_ID) private platformId: object) {}

    ngOnInit() {
        this.title.setTitle("Classic | Avatardle");
        this.meta.updateTag({
            name: "description",
            content: "Play Classic Mode on Avatardle, the daily Avatar guessing game. Guess characters from Avatar: The Last Airbender and The Legend of Korra!"
        });

        if(isPlatformBrowser(this.platformId)){
            this.setData();
        }
    }

    onEnter(char: Character | undefined) {

        if (char) {
            this.guessAttempts++;
            let numCorrect: number = 0;
            let tmp: tileData[] = [{ name: char.name }];

            Object.entries(char).forEach(([key, val], index) => {

                let tileData: tileData = { isCorrect: false, backgroundPosition: `${100 / 6 * index}% 0`, delay: 800 * (index - 1), hasTransition: true };
                let targetVal: any = this.targetChar![key as keyof Character];

                if (val == targetVal) {
                    tileData.isCorrect = true;
                    numCorrect++;
                }
                switch (key) {
                    case "gender":
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

                        this.rand = new Rand(this.ls.progress().date! + char!.name);
                        tileData.affiliations = this.shuffleArray([...val]).slice(0, 3);
                        let count = tileData.affiliations!.reduce((acc, curr) => acc + targetVal.includes(curr) | 0, 0);
                        tileData.isCorrect = (count == 0) ? false : (count == tileData.affiliations!.length) ? true : undefined;
                        break;

                    case "firstAppearance":

                        tileData.episodeName = val;
                        if (!tileData.isCorrect) {
                            tileData.arrowDir = (this.ds.episodes.indexOf(targetVal) < this.ds.episodes.indexOf(val)) ? "none" : "rotate(180deg)";
                            tileData.imageUrl = `images/down-arrow.webp`;
                        }
                        break;
                }
                if (key != "name") {
                    tmp.push(tileData);
                }
            });
            this.tileArray().unshift(...tmp);
            setTimeout(this.checkGuess.bind(this), 800 * 6, numCorrect);
            this.characterData.splice(this.characterData.indexOf(char), 1);

            this.ls.patch(['classic', 'guesses'], this.tileArray().map((t) => {
                return { ...t, hasTransition: false, delay: 0 }
            }));
        }
        this.searchVal.set('');
    }

    checkGuess(numCorrect: number) {

        if (numCorrect == 6) {

            this.ds.updateStats("classic");
            this.ds.throwConfetti(this.ls.progress().classic.guesses.length);
            this.searchVal.set(this.targetChar.name);

            this.ls.patch(['classic', 'complete'], true);
            this.isComplete.set(true);

            setTimeout(() => {
                window.scrollTo({ behavior: "smooth", top: document.body.scrollHeight })
            }, 1000);
        }
    }

    openDialog(name: string) {
        if (name == "settings") {
            this.dialog.open(ClassicSettingsDialogComponent, { width: '50vw', maxWidth: 'none', autoFocus: false }).afterClosed().subscribe((res) => {
                if (res != undefined) {
                    this.setData();
                }
            });
        }
        else if (name == "surrender") {
            this.dialog.open(SurrenderDialogComponent, { width: '30vw', maxWidth: 'none', autoFocus: false }).afterClosed().subscribe((res) => {
                if (res == true) {
                    this.onEnter(this.targetChar);
                }
            });
        }
    }

    setData() {

        this.rand = new Rand(this.ls.progress().date! + "classic");
        this.tileArray.set(this.ls.progress().classic.guesses);
        this.guessAttempts = this.tileArray().length / 6;
        this.characterData = this.shuffleArray(this.ds.getClassicCharacterData(this.ls.progress().classic.series));
        this.targetChar = this.characterData[Math.floor(this.rand.next() * this.characterData.length)];
        let guessedChars = [];
        for (let tile of this.tileArray()) {
            if (tile.name) {
                guessedChars.push(tile.name);
            }
        }
        this.characterData = this.characterData.filter((e) => !guessedChars.includes(e.name));
        this.fanArt = this.ds.fanArt.find(e => e.character == this.targetChar.name)!;

        if (this.ls.progress().classic.complete) {
            this.isComplete.set(true);
            this.submittedToLeaderboard.set(this.ls.progress().classic.leaderboardUsername != undefined);
            this.usernameInput.set(this.ls.progress().classic.leaderboardUsername || '');
            this.searchVal.set(this.tileArray()[0].name!);
            this.fanArt = this.ds.fanArt.find(e => e.character == this.tileArray()[0].name!)!;
        }
        this.img = this.fanArt.images[Math.floor(this.rand.next() * this.fanArt.images.length)];
    }

    shuffleArray(array: any[]) {

        let rand = new Rand(this.ls.progress().date! + "classic_shuffle");
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(rand.next() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    isSurrenderDisabled() {

        return this.isComplete() || this.guessAttempts < 6;
    }

    getSurrenderText(): string {

        let diff = 6 - this.guessAttempts;
        if (diff <= 0 || this.isComplete()) {
            return "Reveal answer";
        }
        else if (diff == 1) {
            return "Reveal answer in 1 more guess";
        }
        return `Reveal answer in ${diff} more guesses`;
    }

    submitToLeaderboard() {

        let charNames: string[] = [];
        for (let i = this.tileArray().length - 6; i > -1; i -= 6) {
            charNames.push(this.tileArray()[i]?.name!);
        }
        const now = new Date();
        const hours = now.getUTCHours();
        const minutes = now.getUTCMinutes();
        let time = `${hours}:${minutes}`;

        this.ds.updateLeaderboard(this.usernameInput().trim(), charNames, time).subscribe({
            error: (err) => {
                this.usernameError.set(true);
            },
            complete: () => {
                this.snackBar.open("Submitted!", undefined, { panelClass: "snack-bar", duration: 4000 });
                this.submittedToLeaderboard.set(true);
                this.ls.patch(['classic', 'leaderboardUsername'], this.usernameInput());
            },
        });
    }

}
