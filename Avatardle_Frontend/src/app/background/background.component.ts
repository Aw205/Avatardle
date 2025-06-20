import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AboutDialogComponent } from '../about-dialog/about-dialog.component';
import { HelpDialogComponent } from '../help-dialog/help-dialog.component';

import {MatIconModule} from '@angular/material/icon';
import { CommentDialogComponent } from '../comment-dialog/comment-dialog.component';

@Component({
  selector: 'background',
  imports: [RouterLink, RouterLinkActive,MatIconModule],
  templateUrl: './background.component.html',
  styleUrl: './background.component.css'
})
export class Background {

  readonly dialog = inject(MatDialog);

  openDialog(name: string) {

    if (name == "about") {
      let dialogRef = this.dialog.open(AboutDialogComponent, { width: '50vw',maxWidth:'none'});
    }
    else if(name == "help"){
      let dialogRef = this.dialog.open(HelpDialogComponent, { width: '70vw', maxWidth: 'none', height: "80vh" });
    }
    else if(name == "comment"){
      let dialogRef = this.dialog.open(CommentDialogComponent, { width: '30vw', maxWidth: 'none', height: "50vh" });
    }
    // else if(name == "calendar"){
    //   let dialogRef = this.dialog.open(CalendarDialogComponent, { width: '30vw', maxWidth: 'none', height: "70vh" });
    // }

  }

}



