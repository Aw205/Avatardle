
import { Component} from '@angular/core';
import {MatDialogContent, MatDialogActions, MatDialogRef } from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';
@Component({
  selector: 'app-give-up-dialog',
  imports: [MatDialogActions,MatDialogContent,TranslatePipe],
  templateUrl: './surrender-dialog.component.html',
  styleUrl: './surrender-dialog.component.css'
})
export class SurrenderDialogComponent {

  constructor(public dialogRef: MatDialogRef<SurrenderDialogComponent>) { }

}
