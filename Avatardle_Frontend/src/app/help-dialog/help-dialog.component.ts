import { Component } from '@angular/core';
import { MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import {MatTabsModule} from '@angular/material/tabs';

@Component({
  selector: 'help-dialog',
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions,MatTabsModule],
  templateUrl: './help-dialog.component.html',
  styleUrl: './help-dialog.component.scss'
})
export class HelpDialogComponent {

  constructor(public dialogRef: MatDialogRef<HelpDialogComponent>) { }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
