import { Component, inject } from '@angular/core';
import {
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
} from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { TranslatePipe } from "@ngx-translate/core";
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-comment-dialog',
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose, FormsModule, TranslatePipe],
  templateUrl: './comment-dialog.component.html',
  styleUrls: ['../shared/dialog-theme.css', '../shared/dialog-buttons.css', './comment-dialog.component.css']
})
export class CommentDialogComponent {

  message: string = "";

  private snackBar = inject(MatSnackBar);

  constructor(private http: HttpClient) {}

  onSubmit() {

    this.snackBar.open("Comment sent, thanks!", undefined, { panelClass: "snack-bar", duration: 4000 });
    const headers = new HttpHeaders({
      "Content-Type": "text/plain"
    });
    const data = JSON.stringify({ feedback: this.message });
    this.http.post("https://script.google.com/macros/s/AKfycbzPXIT7QUAqrSfu8L_zR5Cmu7D-FlqDgSEyFYKYE__9KNN6cA50g53gIrnKHB67eNUM/exec",
      data,
      { headers }).subscribe();
    this.message = "";
  }

}
