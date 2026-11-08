import { Component, computed, inject, signal } from '@angular/core';
import {
  MatDialogTitle,
  MatDialogContent,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { TranslatePipe } from "@ngx-translate/core";
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from '../services/data.service';
import { HyphenatePipe } from '../pipes/hyphenate.pipe';
import { firstValueFrom } from 'rxjs';

import { form, maxLength, required, FormField, FormRoot } from '@angular/forms/signals';

type FavoriteProfileField = 'favoriteCharacters' | 'favoriteShip';

export interface ProfileEditData {
  favoriteCharacters: string[],
  favoriteShip: string[],
  element: string,
  message: string
}

@Component({
  selector: 'app-profile-edit-dialog',
  imports: [MatDialogTitle, MatDialogContent, TranslatePipe, HyphenatePipe, FormField, FormRoot],
  templateUrl: './profile-edit-dialog.component.html',
  styleUrls: ['../shared/dialog-theme.css', '../shared/dialog-buttons.css', './profile-edit-dialog.component.css'],
})
export class ProfileEditDialogComponent {

  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);
  public dialogRef = inject(MatDialogRef<ProfileEditDialogComponent>);
  public data = inject<ProfileEditData>(MAT_DIALOG_DATA);
  private ds = inject(DataService);

  readonly characters = [
    ...this.ds.characterFilter.classic['ATLA-title'],
    ...this.ds.characterFilter.classic['TLOK-title']
  ];
  readonly search = signal('');
  readonly series = signal('all');
  readonly activeFavoriteField = signal<FavoriteProfileField>('favoriteCharacters');
  readonly saveError = signal(false);

  profileEditModel = signal<ProfileEditData>({
    favoriteCharacters: [...this.data.favoriteCharacters],
    favoriteShip: [...this.data.favoriteShip],
    element: this.data.element.toLowerCase(),
    message: this.data.message
  });

  profileForm = form(this.profileEditModel, (schemaPath) => {
    required(schemaPath.element);
    maxLength(schemaPath.message, 150);
  },
    {
      submission: {
        action: async (field) => {
          const value = field().value();

          this.saveError.set(false);
          this.dialogRef.disableClose = true;
          try {
            await firstValueFrom(this.ds.updateProfile(value.message, value.element, value.favoriteCharacters, value.favoriteShip));
            this.snackBar.open(this.translate.instant('profile.editor.saved'), undefined, { panelClass: 'snack-bar', duration: 4000 });
            this.dialogRef.close(value);
          } catch {
            this.saveError.set(true);
          } finally {
            this.dialogRef.disableClose = false;
          }
        }
      }
    });

  readonly elements = [
    { name: 'Fire', value: 'fire' },
    { name: 'Air', value: 'air' },
    { name: 'Water', value: 'water' },
    { name: 'Earth', value: 'earth' }
  ];

  readonly favoriteLimit = computed(() => this.activeFavoriteField() === 'favoriteShip' ? 2 : 3);
  readonly favoriteSlots = computed(() => this.activeFavoriteField() === 'favoriteShip' ? [0, 1] : [0, 1, 2]);
  readonly selectedFavorites = computed(() => this.profileEditModel()[this.activeFavoriteField()]);
  readonly selectionFull = computed(() => this.selectedFavorites().length >= this.favoriteLimit());
  readonly hasChanges = computed(() => {
    const value = this.profileEditModel();
    return value.element !== this.data.element.toLowerCase() || value.message !== this.data.message ||
      value.favoriteCharacters.join('\0') !== this.data.favoriteCharacters.join('\0') ||
      value.favoriteShip.join('\0') !== this.data.favoriteShip.join('\0');
  });

  readonly charList = computed(() => {
    const query = this.search().trim().toLowerCase();
    const roster = this.series() === 'all' ? this.characters
      : this.ds.characterFilter.classic[this.series() === 'atla' ? 'ATLA-title' : 'TLOK-title'];
    return roster.filter(char => char.toLowerCase().includes(query));
  });

  setFavoriteField(field: FavoriteProfileField) {
    if (this.activeFavoriteField() === field) return;
    this.activeFavoriteField.set(field);
    this.search.set('');
  }

  toggleFavorite(char: string) {
    if (this.profileForm().submitting() || !this.characters.includes(char)) return;
    const field = this.profileForm[this.activeFavoriteField()];
    const selected = field().value();
    if (selected.includes(char)) {
      field().value.set(selected.filter(name => name !== char));
    } else if (!this.selectionFull()) {
      field().value.set([...selected, char]);
    }
  }

}
