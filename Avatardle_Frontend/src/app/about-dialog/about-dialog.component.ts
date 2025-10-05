import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  MatDialogTitle,
  MatDialogContent,
  MatDialogRef,
} from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-about-dialog',
    imports: [MatDialogTitle, MatDialogContent,TranslatePipe],
    templateUrl: './about-dialog.component.html',
    styleUrl: './about-dialog.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AboutDialogComponent {

  constructor(public dialogRef: MatDialogRef<AboutDialogComponent>){}

}
