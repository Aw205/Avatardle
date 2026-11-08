import { Component, inject, signal } from '@angular/core';
import { MatDialogTitle, MatDialogContent, MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { LocalStorageService } from '../services/local-storage.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-classic-settings-dialog',
  imports: [MatDialogTitle, MatDialogContent, MatDialogClose, FormsModule, TranslatePipe, ReactiveFormsModule],
  templateUrl: './classic-settings-dialog.component.html',
  styleUrls: ['../shared/dialog-theme.css', '../shared/dialog-buttons.css', './classic-settings-dialog.component.css'],
})
export class ClassicSettingsDialogComponent {
  private readonly ls = inject(LocalStorageService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<ClassicSettingsDialogComponent>);
  readonly list = [
    { name: 'ATLA-title', icon: 'images/characters/Aang.webp', selected: false },
    { name: 'TLOK-title', icon: 'images/characters/Korra.webp', selected: false },
    { name: 'AATLA-title', icon: 'images/AATLA_thumbnail.webp', selected: false }
  ];
  readonly colorMode = signal('');
  readonly colorForm = new FormGroup({
    incorrectColor: new FormControl({ value: '#000000', disabled: true }, { nonNullable: true }),
    correctColor: new FormControl({ value: '#000000', disabled: true }, { nonNullable: true })
  });

  get selectedCount(): number {
    return this.list.filter(item => item.selected).length;
  }

  ngOnInit() {
    const { series, colors } = this.ls.progress().classic;
    for (const item of this.list) {
      item.selected = series.includes(item.name);
    }
    this.colorForm.setValue({ incorrectColor: colors.incorrectColor, correctColor: colors.correctColor });
    this.setColor(colors.mode);
  }

  setColor(mode: string) {
    this.colorMode.set(mode);
    if (mode === 'custom') {
      this.colorForm.enable();
    } else {
      this.colorForm.disable();
      const [incorrectColor, correctColor] = mode.split('+');
      this.colorForm.setValue({ incorrectColor, correctColor });
    }
  }

  onSave() {
    const series = this.list.filter(item => item.selected).map(item => item.name);
    if (!series.length) return;

    this.ls.patch(['classic', 'colors'], { mode: this.colorMode(), ...this.colorForm.getRawValue() });
    this.snackBar.open('Saved!', undefined, { panelClass: 'snack-bar', duration: 4000 });

    const previousSeries = this.ls.progress().classic.series;
    const seriesChanged = series.length !== previousSeries.length || series.some((name, index) => name !== previousSeries[index]);
    if (seriesChanged) {
      this.ls.patch(['classic', 'series'], series);
      if (!this.ls.progress().classic.complete) {
        this.ls.patch(['classic', 'guesses'], []);
        this.dialogRef.close({ reset: true });
        return;
      }
    }
    this.dialogRef.close();
  }
}
