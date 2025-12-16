import { Component } from '@angular/core';
import {
  MatDialogTitle,
  MatDialogContent,
  MatDialogRef,
} from '@angular/material/dialog';
import { TranslatePipe } from "@ngx-translate/core";

@Component({
  selector: 'app-notes-dialog',
  imports: [MatDialogTitle, MatDialogContent,TranslatePipe],
  templateUrl: './notes-dialog.component.html',
  styleUrl: './notes-dialog.component.css'
})
export class NotesDialogComponent {

  constructor(public dialogRef: MatDialogRef<NotesDialogComponent>) {}

}
