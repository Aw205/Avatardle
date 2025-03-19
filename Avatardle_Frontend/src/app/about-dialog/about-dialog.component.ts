import { Component } from '@angular/core';
import {
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogRef,
} from '@angular/material/dialog';

@Component({
    selector: 'app-about-dialog',
    imports: [MatDialogTitle, MatDialogContent, MatDialogActions],
    templateUrl: './about-dialog.component.html',
    styleUrl: './about-dialog.component.css'
})
export class AboutDialogComponent {


  constructor(public dialogRef: MatDialogRef<AboutDialogComponent>,){

  }

  onNoClick(): void {
    this.dialogRef.close();
  }

}
