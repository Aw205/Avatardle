import { Component, Input } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';

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
  imports: [MatTooltipModule,MatIconModule],
  templateUrl: './tile.component.html',
  styleUrl: './tile.component.css'
})
export class TileComponent {

  @Input() data!: tileData;
  flipTile: boolean = false;

  ngOnInit() {
    setTimeout(() => {
      this.flipTile = true;
    }, this.data.delay);
  }

  getTag(tag: string) {
    return tag.replace(/\s/g, '-').toLowerCase();
  }

  getBoxShadow(isCorrect: boolean | undefined) {
    return (isCorrect==undefined) ? "partial" : (isCorrect ? "correct" : "incorrect");
  }

}
