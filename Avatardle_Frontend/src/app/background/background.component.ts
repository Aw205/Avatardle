import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AboutDialogComponent } from '../about-dialog/about-dialog.component';
import { HelpDialogComponent } from '../help-dialog/help-dialog.component';

@Component({
  selector: 'background',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './background.component.html',
  styleUrl: './background.component.css'
})
export class Background {

  readonly dialog = inject(MatDialog);

  openDialog(name: string) {

    if (name == "about") {
      let dialogRef = this.dialog.open(AboutDialogComponent, { width: '50vw',maxWidth:'none'});
      dialogRef.afterClosed().subscribe(result => { });
    }
    else if(name == "help"){
      let dialogRef = this.dialog.open(HelpDialogComponent, { width: '70vw', maxWidth: 'none', height: "80vh" });
      dialogRef.afterClosed().subscribe(result => {});
    }


  }

}



