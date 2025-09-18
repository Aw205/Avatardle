import { Component, inject } from '@angular/core';
import {
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogRef,
} from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { LocalStorageService } from '../services/local-storage.service';

@Component({
  selector: 'app-classic-settings-dialog',
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, FormsModule,TranslatePipe],
  templateUrl: './classic-settings-dialog.component.html',
  styleUrl: './classic-settings-dialog.component.css',
})
export class ClassicSettingsDialogComponent {

  ls: LocalStorageService = inject(LocalStorageService);
  isValid: boolean = true;
  list: { name: string, icon: string, selected: boolean }[] = [

    { name: 'ATLA-title', icon: "images/characters/Aang.webp", selected: false },
    { name: 'TLOK-title', icon: "images/characters/Korra.webp", selected: false }
  ]

  constructor(public dialogRef: MatDialogRef<ClassicSettingsDialogComponent>) {

  }

  ngOnInit() {

    for (let item of this.list) {
      if (this.ls.progress.classic.series.includes(item.name)) {
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

    if (this.isValid && !this.ls.progress.classic.complete) {
      let series = this.list.filter((item) => item.selected == true).map((item) => item.name);
      this.ls.progress.classic.series = series;
      this.ls.progress.classic.guesses = [];
      this.ls.update();
      window.location.reload();
    }
  }

}
