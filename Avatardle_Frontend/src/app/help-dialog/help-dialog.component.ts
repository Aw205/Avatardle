import { Component } from '@angular/core';
import { MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'help-dialog',
  imports: [MatDialogTitle, MatDialogContent, MatTabsModule,TranslatePipe],
  templateUrl: './help-dialog.component.html',
  styleUrl: './help-dialog.component.scss'
})
export class HelpDialogComponent {

  constructor(public dialogRef: MatDialogRef<HelpDialogComponent>) { }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
