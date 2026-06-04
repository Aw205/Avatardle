import { Component, effect, inject, signal, WritableSignal } from '@angular/core';
import { MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogRef } from '@angular/material/dialog';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormControl, FormGroup, FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { LocalStorageService } from '../services/local-storage.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-classic-settings-dialog',
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, FormsModule, TranslatePipe, MatSelectModule, MatFormFieldModule, ReactiveFormsModule],
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
  correctColor: WritableSignal<string> = signal("#000000");
  incorrectColor: WritableSignal<string> = signal("#000000");
  colorMode: WritableSignal<string> = signal("");

  colorForm = new FormGroup({
    incorrectColor: new FormControl({ value: this.incorrectColor(), disabled: true }),
    correctColor: new FormControl({ value: this.correctColor(), disabled: true })
  });

  private snackBar = inject(MatSnackBar);

  constructor(public dialogRef: MatDialogRef<ClassicSettingsDialogComponent>) {
    effect(() => {
      this.colorForm.get("incorrectColor")?.setValue(this.incorrectColor());
      this.colorForm.get("correctColor")?.setValue(this.correctColor());
    });
  }

  ngOnInit() {

    for (let item of this.list) {
      if (this.ls.progress().classic.series.includes(item.name)) {
        item.selected = true;
      }
    }
    this.updateCount();

    this.colorMode.set(this.ls.progress().classic.colors.mode);
    this.incorrectColor.set(this.ls.progress().classic.colors.incorrectColor);
    this.correctColor.set(this.ls.progress().classic.colors.correctColor);

    if (this.colorMode() == "custom") {
      this.colorForm.enable();
    }
  }

  updateCount() {

    this.selectedCount.set(this.list.filter(e => e.selected).length);
  }


  setColor(event: MatSelectChange) {

    this.colorMode.set(event.value);
    if (event.value == "custom") {
      this.colorForm.enable();
    }
    else {
      this.colorForm.disable();
      let colors = event.value.split("+");
      this.incorrectColor.set(colors[0]);
      this.correctColor.set(colors[1]);
    }

  }

  onSave() {

    this.snackBar.open("Saved!", undefined, { panelClass: "snack-bar", duration: 4000 });

    let series = this.list.filter((item) => item.selected == true).map((item) => item.name);

    if (this.colorMode() == "custom") {
      this.incorrectColor.set(this.colorForm.get('incorrectColor')?.value!);
      this.correctColor.set(this.colorForm.get('correctColor')?.value!);
    }

    this.ls.patch(['classic', 'colors'], { mode: this.colorMode(), incorrectColor: this.incorrectColor(), correctColor: this.correctColor() });

    if (JSON.stringify(series) != JSON.stringify(this.ls.progress().classic.series)) {
      this.ls.patch(['classic', 'series'], series);
      if (!this.ls.progress().classic.complete) {
        this.ls.patch(['classic', 'guesses'], []);
        return this.dialogRef.close({ reset: true });
      }
    }
    this.dialogRef.close();
  }

}
