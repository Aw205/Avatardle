import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';

@Component({
  selector: 'hint-dialog',
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions],
  templateUrl: './hint-dialog.component.html',
  styleUrl: './hint-dialog.component.css'
})
export class HintDialogComponent {


  constructor(public dialogRef: MatDialogRef<HintDialogComponent>, @Inject(MAT_DIALOG_DATA) public data:any){

  }

  onNoClick(): void {
    this.dialogRef.close();
  }

}
