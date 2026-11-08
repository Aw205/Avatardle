import { Component } from '@angular/core';
import {
  MatDialogTitle,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-about-dialog',
  imports: [MatDialogTitle, MatDialogContent, MatDialogClose, TranslatePipe],
  templateUrl: './about-dialog.component.html',
  styleUrls: ['../shared/dialog-theme.css', '../shared/dialog-buttons.css', './about-dialog.component.css']
})
export class AboutDialogComponent {

}
