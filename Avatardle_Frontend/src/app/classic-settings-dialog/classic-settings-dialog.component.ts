import { Component, inject, signal, WritableSignal } from '@angular/core';
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
  list: { name: string, icon: string, selected: boolean }[] = [
    { name: 'ATLA-title', icon: "images/characters/Aang.webp", selected: false },
    { name: 'TLOK-title', icon: "images/characters/Korra.webp", selected: false }
  ];
  selectedCount: WritableSignal<number> = signal(0);
  private snackBar = inject(MatSnackBar);

  constructor(public dialogRef: MatDialogRef<ClassicSettingsDialogComponent>) { }

  ngOnInit() {

    for (let item of this.list) {
      if (this.ls.progress().classic.series.includes(item.name)) {
        item.selected = true;
      }
    }
    this.updateCount();
  }

  updateCount() {

    this.selectedCount.set(this.list.filter(e => e.selected).length);
  }

  onSave() {

    this.snackBar.open("Saved!", undefined, { panelClass: "snack-bar", duration: 4000 });
    let series = this.list.filter((item) => item.selected == true).map((item) => item.name);

    if (JSON.stringify(series) != JSON.stringify(this.ls.progress().classic.series)) {
      this.ls.patch(['classic','series'],series);
      if (!this.ls.progress().classic.complete) {
        this.ls.patch(['classic','guesses'],[]);
        return this.dialogRef.close({ reset: true });
      }
    }
    this.dialogRef.close();
  }

}
