import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AboutDialogComponent } from '../about-dialog/about-dialog.component';

@Component({
    selector: 'background',
    imports: [RouterLink, RouterLinkActive],
    templateUrl: './background.component.html',
    styleUrl: './background.component.css'
})
export class Background {

  @ViewChild('stat') statModal!: ElementRef;

  readonly dialog = inject(MatDialog);

  ngOnInit() {

    fetch("json/characters.json")
      .then(response => response.json())
      .then(data => {
      });
  }

  openDialog() {

    let dialogRef = this.dialog.open(AboutDialogComponent,{width:'50vw'});
    dialogRef.afterClosed().subscribe(result => {
    });
  }

}



