import { Component, inject } from '@angular/core';
import { MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { LocalStorageService } from '../services/local-storage.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-classic-settings-dialog',
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, FormsModule, TranslatePipe],
  templateUrl: './classic-settings-dialog.component.html',
  styleUrl: './classic-settings-dialog.component.css',
})
export class ClassicSettingsDialogComponent {

  ls: LocalStorageService = inject(LocalStorageService);
  isValid: boolean = true;
  list: { name: string, icon: string, selected: boolean }[] = [
    { name: 'ATLA-title', icon: "images/characters/Aang.webp", selected: false },
    { name: 'TLOK-title', icon: "images/characters/Korra.webp", selected: false }
  ];

  private snackBar = inject(MatSnackBar);

  constructor(public dialogRef: MatDialogRef<ClassicSettingsDialogComponent>) { }

  ngOnInit() {

    for (let item of this.list) {
      if (this.ls.progress.classic.series.includes(item.name)) {
        item.selected = true;
      }
    }
  }

  onSave() {

    this.isValid = this.list.some((item) => item.selected);
    if (this.isValid) {

      this.snackBar.open("Saved!", undefined, { panelClass: "snack-bar", duration: 4000 });
      let series = this.list.filter((item) => item.selected == true).map((item) => item.name);

      if (JSON.stringify(series) != JSON.stringify(this.ls.progress.classic.series)) {

        this.ls.progress.classic.series = series;
        if (!this.ls.progress.classic.complete) {
          this.ls.progress.classic.guesses = [];
          this.ls.update();
          return this.dialogRef.close({ reset: true });
        }
        this.ls.update();
      }
      this.dialogRef.close();
    }
  }

}
