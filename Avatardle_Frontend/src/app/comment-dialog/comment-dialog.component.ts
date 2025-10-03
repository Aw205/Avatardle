import { Component, inject } from '@angular/core';
import {
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { TranslatePipe } from "@ngx-translate/core";
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-comment-dialog',
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatInputModule, MatFormFieldModule, FormsModule, TranslatePipe],
  templateUrl: './comment-dialog.component.html',
  styleUrl: './comment-dialog.component.css'
})
export class CommentDialogComponent {

  message: string = "";
  buttonText: string = "commentDialog.comment";

  private snackBar = inject(MatSnackBar);

  constructor(public dialogRef: MatDialogRef<CommentDialogComponent>, public http: HttpClient) {}

  onSubmit() {

    this.snackBar.open("Comment sent, thanks!", undefined, { panelClass: "snack-bar", duration: 4000 });
    var headers = new HttpHeaders({
      "Content-Type": "text/plain"
    });
    let data = JSON.stringify({ feedback: this.message });
    this.http.post("https://script.google.com/macros/s/AKfycbzPXIT7QUAqrSfu8L_zR5Cmu7D-FlqDgSEyFYKYE__9KNN6cA50g53gIrnKHB67eNUM/exec",
      data,
      { headers: headers }).subscribe((data) => { });
    this.message = "";
  }



}

