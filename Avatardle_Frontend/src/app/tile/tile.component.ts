import { isPlatformBrowser } from '@angular/common';
import { Component, Input, PLATFORM_ID, signal, WritableSignal, Inject, inject, input, effect } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import { LocalStorageService } from '../services/local-storage.service';

export interface tileData {

  name?: string
  isCorrect?: boolean,
  episodeName?: string,
  text?: string,
  imageUrl?: string,
  backgroundPosition?: string
  affiliations?: string[]
  delay?: number;
  arrowDir?: string;
  element?: string;
  hasTransition?: boolean;

}

@Component({
  selector: 'tile',
  imports: [MatTooltipModule, TranslatePipe],
  templateUrl: './tile.component.html',
  styleUrl: './tile.component.css'
})
export class TileComponent {

  @Input() data!: tileData;
  ls = inject(LocalStorageService);
  flipTile: WritableSignal<boolean> = signal(false);
  color: WritableSignal<string> = signal('')
  trigger = input.required<string>();

  constructor(@Inject(PLATFORM_ID) private platformId: object) {

    effect(() => {
      let val = this.trigger();
      this.setBoxShadow(this.data.isCorrect);
    });
  }

  ngOnInit() {

    if (isPlatformBrowser(this.platformId)) {
      this.setBoxShadow(this.data.isCorrect);
    }

    setTimeout(() => {
      this.flipTile.set(true);
    }, this.data.delay);
  }

  getTag(tag: string) {
    return tag.replace(/\s/g, '-').toLowerCase();
  }

  setBoxShadow(isCorrect: boolean | undefined) {

    if (isCorrect == undefined) {
      this.color.set(`0 0 1.5rem rgba(255, 192, 5, 0.8)`);
    }
    else if (isCorrect) {
      this.color.set(`0 0 1.5rem ${this.ls.progress().classic.colors.correctColor}`);
    }
    else {
      this.color.set(`0 0 1.5rem ${this.ls.progress().classic.colors.incorrectColor}bf`);
    }
  }

}
