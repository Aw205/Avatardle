import { Component } from '@angular/core';
import {
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { AvatardleProgress } from '../app.component';

@Component({
  selector: 'app-classic-settings-dialog',
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatInputModule, FormsModule],
  templateUrl: './classic-settings-dialog.component.html',
  styleUrl: './classic-settings-dialog.component.css',
})
export class ClassicSettingsDialogComponent {

  progress: AvatardleProgress = JSON.parse(localStorage.getItem("avatardle_progress")!);
  saveConfirmation: string = "";
  isValid: boolean = false;
  list: { name: string, icon: string, selected: boolean }[] = [

    { name: 'Avatar: The Last Airbender', icon: "images/characters/Aang.webp", selected: false },
    { name: 'Coming soon...', icon: "images/characters/Korra.webp", selected: false }
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

    if (this.isValid) {

      let series = this.list.filter((item) => item.selected == true).map((item) => item.name);
      series = ["Avatar: The Last Airbender"]; // remove later
      this.progress.classic.series = series;
      if (!this.progress.classic.complete) {
        this.progress.classic.guesses = [];
      }
      localStorage.setItem("avatardle_progress", JSON.stringify(this.progress));
      window.location.reload();
    }
    this.saveConfirmation = "*Select at least 1 series";
  }

}
