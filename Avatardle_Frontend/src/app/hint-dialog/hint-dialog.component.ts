import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';

export interface QuoteHintData {
  kind: 'previous' | 'next' | 'episode';
  quote: string;
}

@Component({
  selector: 'hint-dialog',
  imports: [MatDialogTitle, MatDialogContent, MatDialogClose, TranslatePipe],
  templateUrl: './hint-dialog.component.html',
  styleUrls: ['../shared/dialog-theme.css', './hint-dialog.component.css']
})
export class HintDialogComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public data: QuoteHintData) { }

  get episodeCode(): string {
    return this.data.quote.match(/^(S\d+E\d+)(?:\s|$)/i)?.[1] ?? '';
  }

  get episodeTitle(): string {
    return this.data.quote.replace(/^(S\d+E\d+)\s*/i, '').trim();
  }
}
