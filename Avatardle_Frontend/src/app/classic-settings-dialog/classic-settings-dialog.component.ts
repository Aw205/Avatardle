import { Component } from '@angular/core';
import {
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogRef,
} from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { AvatardleProgress } from '../app.component';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-classic-settings-dialog',
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, FormsModule,TranslatePipe],
  templateUrl: './classic-settings-dialog.component.html',
  styleUrl: './classic-settings-dialog.component.css',
})
export class ClassicSettingsDialogComponent {

  progress: AvatardleProgress = JSON.parse(localStorage.getItem("avatardle_progress")!);
  isValid: boolean = true;
  list: { name: string, icon: string, selected: boolean }[] = [

    { name: 'ATLA-title', icon: "images/characters/Aang.webp", selected: false },
    { name: 'TLOK-title', icon: "images/characters/Korra.webp", selected: false }
  ]

  constructor(public dialogRef: MatDialogRef<ClassicSettingsDialogComponent>) {

  }

  ngOnInit() {

    for (let item of this.list) {
      if (this.progress.classic.series.includes(item.name)) {
        item.selected = true;
      }
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onSave() {

    this.isValid = this.list.some((item) => {
      return item.selected;
    });

    if (this.isValid && !this.progress.classic.complete) {
      let series = this.list.filter((item) => item.selected == true).map((item) => item.name);
      this.progress.classic.series = series;
      this.progress.classic.guesses = [];
      localStorage.setItem("avatardle_progress", JSON.stringify(this.progress));
      window.location.reload();
    }
  }

}
