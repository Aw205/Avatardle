import { Component, inject, Input } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'share-results',
  imports: [MatMenuModule],
  templateUrl: './share-results.component.html',
  styleUrl: './share-results.component.css'
})
export class ShareResultsComponent {

  @Input() numGuesses: number = 0;
  @Input() tileData: any[] = [];
  @Input() mode!: "classic" | "quote" | "picture" | "music";
  messages: any;
  private snackBar = inject(MatSnackBar);

  ngOnInit() {

    let guess = ""
    if (this.tileData.length > 0) {
      for (let i of this.tileData) {
        if (i.name !== undefined) {
          guess += "\n";
          continue;
        }
        if (i.isCorrect) {
          guess += "🟩";
        }
        else if (i.isCorrect === false) {
          guess += "🟥";
        }
        else {
          guess += "🟨";
        }
      }
    }
    else {
      guess = `\n${this.mode} - `;
      for (let i = 0; i < this.numGuesses - 1; i++) {
        guess += '🟥';
      }
      guess += '🟩';
    }

    this.messages = {
      classic: encodeURIComponent(`Avatardle.com - ${new Date().toLocaleDateString()} ${guess} \nhttps://avatardle.com/`),
      quote: encodeURIComponent(`Avatardle.com - ${new Date().toLocaleDateString()} ${guess} \nhttps://avatardle.com/`),
      picture: encodeURIComponent(`Avatardle.com - ${new Date().toLocaleDateString()} ${guess} \nhttps://avatardle.com/`),
      music: encodeURIComponent(`Avatardle.com - ${new Date().toLocaleDateString()} ${guess} \nhttps://avatardle.com/`)
    }
  }

  copy() {
    navigator.clipboard.writeText(decodeURIComponent(this.messages[this.mode]));
    this.snackBar.open("Copied to clipboard", undefined, { panelClass: "snack-bar", duration: 4000 });
  }

}
