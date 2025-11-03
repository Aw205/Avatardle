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
  @Input() mode!: "classic" | "quote" | "picture" | "music";
  messages: any;
  private snackBar = inject(MatSnackBar);

  ngOnInit() {

    this.messages = {
      classic: encodeURIComponent(`I guessed today's character in ${this.numGuesses} tries! ༄ Check out Avatardle.com :)`),
      quote: encodeURIComponent(`I guessed today's quote in ${this.numGuesses} tries! 💬 Check out Avatardle.com :)`),
      picture: encodeURIComponent(`I guessed today's scene in ${this.numGuesses} tries! 🏞️ Check out Avatardle.com :)`),
      music: encodeURIComponent(`I guessed today's music in ${this.numGuesses} tries! 🎵 Check out Avatardle.com :)`)
    }
  }

  copy() {
    navigator.clipboard.writeText(decodeURIComponent(this.messages[this.mode]));
    this.snackBar.open("Copied to clipboard", undefined, { panelClass: "snack-bar", duration: 4000 });
  }

}
