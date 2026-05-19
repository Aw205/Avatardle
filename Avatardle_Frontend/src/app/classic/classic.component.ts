import { ChangeDetectionStrategy, Component, computed, Inject, inject, model, PLATFORM_ID, Signal, signal, WritableSignal } from '@angular/core';
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
// import {MatDatepickerModule} from '@angular/material/datepicker';
// import {provideNativeDateAdapter} from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';
import { LeaderboardService } from '../services/leaderboard.service';
import { getSurrenderText } from '../game-mode-utils';

@Component({
    selector: 'classic',
    // providers:[provideNativeDateAdapter()],
    imports: [FormsModule, TileComponent, MatTooltipModule, TmNgOdometerModule, AsyncPipe, HyphenatePipe, CountdownComponent, TranslatePipe, ShareResultsComponent],
    templateUrl: './classic.component.html',
    styleUrl: './classic.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClassicMode {

    environment = environment;

    snackBar = inject(MatSnackBar);
    submittedToLeaderboard: WritableSignal<boolean> = signal(false);
    inputDisabled: WritableSignal<boolean> = signal(false);
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

    private leaderboardService = inject(LeaderboardService);
    ls = inject(LocalStorageService);
    title = inject(Title);
    meta = inject(Meta);
    ds = inject(DataService);
    dialog = inject(MatDialog);
    as = inject(AuthService);

    usernameInput: WritableSignal<string> = signal('');
    colorTrigger: WritableSignal<string> = signal('');
    // minDate: Date = new Date(2025,3,14);
    // maxDate: Date = new Date();
    // selectedDate = model<Date | null>(null);

    constructor(@Inject(PLATFORM_ID) private platformId: object) { }

    ngOnInit() {
        this.title.setTitle("Classic | Avatardle");
        this.meta.updateTag({
            name: "description",
            content: "Play Classic Mode on Avatardle, the daily Avatar guessing game. Guess characters from Avatar: The Last Airbender and The Legend of Korra!"
        });

        if (isPlatformBrowser(this.platformId)) {
            this.setData();
            this.as.getMe().subscribe((data) => {
                this.usernameInput.set(data.username);
                this.inputDisabled.set(true);
            })
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
                        if (targetVal == "All" && ["Fire", "Water", "Earth", "Air"].includes(val)) {
                            tileData.isCorrect = undefined;
                        }
                        if (val == "All" && ["Fire", "Water", "Earth", "Air"].includes(targetVal)) {
                            tileData.isCorrect = undefined;
                        }
                        break;
                    case "affiliations":
                        tileData.affiliations = this.shuffleArray([...val]).slice(0, 3);
                        let count = tileData.affiliations!.reduce((acc, curr) => acc + targetVal.includes(curr) | 0, 0);
                        let targetLength = Math.min(targetVal.length, 3);
                        tileData.isCorrect = (count == 0) ? false : (count == targetLength) ? true : undefined;
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
            this.ds.updateDiscoveredCharacters(this.targetChar.name);
            this.searchVal.set(this.targetChar.name);

            this.isComplete.set(true);
            this.ls.patch(['classic', 'complete'], true);
            this.ds.throwConfetti(this.ls.progress().classic.guesses.length);
            this.ds.updateStats("classic");

            setTimeout(() => {
                window.scrollTo({ behavior: "smooth", top: document.body.scrollHeight })
            }, 1000);
        }
    }

    openDialog(name: string) {
        if (name == "settings") {
            this.dialog.open(ClassicSettingsDialogComponent, { panelClass: "classic-settings-dialog", autoFocus: false }).afterClosed().subscribe((res) => {
                this.colorTrigger.set("");
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

        this.rand = new Rand(this.ls.progress().date! + "classic" + this.ls.progress().classic.series);
        this.tileArray.set(this.ls.progress().classic.guesses);
        this.guessAttempts = this.tileArray().length / 6;
        this.characterData = this.ds.getClassicCharacterData(this.ls.progress().classic.series);
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
       return getSurrenderText(this.isComplete(),this.guessAttempts,6);
    }

    submitToLeaderboard() {

        let charNames: string[] = [];
        for (let i = this.tileArray().length - 6; i > -1; i -= 6) {
            charNames.push(this.tileArray()[i]?.name!);
        }

        this.leaderboardService.updateLeaderboard(this.usernameInput().trim(), charNames).subscribe({
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
