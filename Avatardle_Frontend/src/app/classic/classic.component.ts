import { afterNextRender, Component, inject, Inject, PLATFORM_ID, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Rand, { PRNG } from 'rand-seed';
import { tileData } from '../tile/tile.component';
import { TileComponent } from '../tile/tile.component';
import { Character, DailyStats, DataService, FanArt } from '../services/data.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TmNgOdometerModule } from 'odometer-ngx';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { HyphenatePipe } from '../pipes/hyphenate.pipe';
import { MatDialog } from '@angular/material/dialog';
import { ClassicSettingsDialogComponent } from '../classic-settings-dialog/classic-settings-dialog.component';
import { CountdownComponent } from 'ngx-countdown'
import { TranslatePipe } from '@ngx-translate/core';
import { Meta, Title } from '@angular/platform-browser';
import { LocalStorageService } from '../services/local-storage.service';

@Component({
    selector: 'classic',
    imports: [FormsModule, TileComponent, MatTooltipModule, TmNgOdometerModule, AsyncPipe, HyphenatePipe, CountdownComponent, TranslatePipe],
    templateUrl: './classic.component.html',
    styleUrl: './classic.component.css'
})
export class ClassicMode {

    charList: Character[] = [];
    characterData: Character[] = [];
    searchVal: WritableSignal<string> = signal('');
    isComplete: WritableSignal<boolean> = signal(false);
    isVisible: boolean = true;
    selected: Character | undefined;
    guessAttempts: number = 0;
    tileArray: WritableSignal<tileData[]> = signal([]);
    targetChar!: Character;
    $stat!: Observable<DailyStats>;
    rand!: Rand;

    fanArt!: FanArt;
    img!: { pathName: string, artist: { name: string, link: string }, epithet: string };

    ls: LocalStorageService = inject(LocalStorageService);
    isBrowser: boolean = (typeof window != "undefined");

    constructor(private ds: DataService, private dialog: MatDialog, private title: Title, private meta: Meta) {

        afterNextRender(() => {

            this.rand = new Rand(this.ls.progress.date! + "classic");

            if (this.ls.progress.classic.complete) {
                this.isComplete.set(true);
                this.searchVal.set(this.ls.progress.classic.target);
            }

            this.tileArray.set(this.ls.progress.classic.guesses);
            this.guessAttempts = this.tileArray().length / 6;

            this.$stat = this.ds.stats$;
            this.characterData = this.ds.getClassicCharacterData(this.ls.progress.classic.series);
            this.targetChar = this.characterData[Math.floor(this.rand.next() * this.characterData.length)];

            this.fanArt = this.ds.fanArt.find(e => e.character == this.targetChar.name)!;
            this.img = this.fanArt.images[Math.floor(this.rand.next() * this.fanArt.images.length)];
        });
    }

    ngOnInit() {
        this.title.setTitle("Avatardle - Classic");
        this.meta.updateTag({
            name: "description",
            content: "Guess characters from Avatar the Last Airbender and The Legend of Korra based on their various traits."
        });
    }

    onInput() {
        this.charList = this.characterData.filter(char => char.name.toLowerCase().includes(this.searchVal().toLowerCase()) && this.searchVal() != "");
        this.selected = this.charList[0];
    }

    onEnter(char: Character | undefined) {

        if (char) {
            this.guessAttempts++;
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

                        tileData.affiliations = val.sort(() => 0.5 - this.rand.next()).slice(0, 3);
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
            this.ls.progress.classic.guesses = this.tileArray().map((t) => {
                return { ...t, hasTransition: false, delay: 0 }
            });
            this.ls.update();
        }
        this.selected = undefined;
        this.searchVal.set('');
        this.charList = [];
    }

    checkGuess(numCorrect: number) {

        if (numCorrect == 6) {

            this.ds.updateStats("classic");
            this.ds.throwConfetti(this.ls.progress.classic.guesses.length);
            this.searchVal.set(this.targetChar.name);

            this.ls.progress.classic.target = this.targetChar.name;
            this.ls.progress.classic.complete = true;
            this.ls.update();
            this.isComplete.set(true);

            setTimeout(() => {
                window.scrollTo({ behavior: "smooth", top: document.body.scrollHeight })
            }, 1000);
        }
    }

    openDialog(name: string) {
        if (name == "settings") {
            this.dialog.open(ClassicSettingsDialogComponent, { width: '50vw', maxWidth: 'none', autoFocus: false });
        }
    }

    getCountdownConfig() {
        return this.ds.getCountdownConfig();
    }
}
