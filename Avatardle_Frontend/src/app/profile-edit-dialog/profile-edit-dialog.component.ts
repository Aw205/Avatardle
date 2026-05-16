import { ChangeDetectionStrategy, Component, computed, Inject, inject, linkedSignal, model, Signal, signal, WritableSignal } from '@angular/core';
import {
  MatDialogTitle,
  MatDialogContent,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { TranslatePipe } from "@ngx-translate/core";
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../services/auth.service';
import { type MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { DataService } from '../services/data.service';
import { HyphenatePipe } from '../pipes/hyphenate.pipe';


@Component({
  selector: 'app-profile-edit-dialog',
  imports: [MatDialogTitle, MatDialogContent, MatInputModule, MatFormFieldModule, FormsModule, TranslatePipe, MatChipsModule, HyphenatePipe],
  templateUrl: './profile-edit-dialog.component.html',
  styleUrl: './profile-edit-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileEditDialogComponent {


  private snackBar = inject(MatSnackBar);
  auth: AuthService = inject(AuthService);
  ds: DataService = inject(DataService);

  characters: string[] = [];
  favCharVal: WritableSignal<string> = model('');
  favShipVal: WritableSignal<string> = model('');
  favoriteCharacters: WritableSignal<string[]> = signal([]);
  favoriteShip: WritableSignal<string[]> = signal([]);
  favChips: WritableSignal<string[]> = signal([]);
  message: WritableSignal<string> = model('');

  elements: WritableSignal<{ name: string }>[] = [

    signal({ name: 'Fire' }),
    signal({ name: 'Air' }),
    signal({ name: 'Water' }),
    signal({ name: 'Earth' })

  ];
  element: WritableSignal<string | null> = signal(null);

  charList: Signal<string[]> = linkedSignal({
    source: () => ({ a: this.favCharVal(), b: this.favShipVal() }),
    computation: (current, previous) => {
      let val = "";
      if (current.a !== previous?.source.a) {
        val = current.a.toLowerCase();
        this.favChips = this.favoriteCharacters;
      }
      else if (current.b !== previous?.source.b) {
        val = current.b.toLowerCase();
        this.favChips = this.favoriteShip;
      }
      return this.characters.filter(char => char.toLowerCase().includes(val));
    }
  });

  chipColors: any = { Fire: "#5E0006", Air: "#a8eef080", Water: "#226fdd", Earth: "#26582e", All: "#bf9740", None: "#748185" };

  constructor(public dialogRef: MatDialogRef<ProfileEditDialogComponent>, public http: HttpClient, @Inject(MAT_DIALOG_DATA) public data: any) {

    this.favoriteCharacters.set(data.favChars);
    this.favoriteShip.set(data.favShip);
    this.message.set(data.message);
    this.element.set(data.element);
  }

  ngOnInit() {
    this.characters = this.ds.characterFilter.classic["ATLA-title"].concat(this.ds.characterFilter.classic["TLOK-title"]);
  }

  getColor(val: string) {

    let s = this.ds.characterData.find((char) => char.name == val)?.bendingElement!;
    return this.chipColors[s];

  }

  onFocus(sig: WritableSignal<string[]>) {

    this.favChips = sig;

  }

  addChar(char: string) {

    if (this.favChips().includes(char)) {
      return;
    }
    if (this.favChips == this.favoriteShip && this.favChips().length < 2) {
      this.favChips.update(c => [...c, char]);
    }
    else if (this.favChips == this.favoriteCharacters && this.favChips().length < 3) {
      this.favChips.update(c => [...c, char]);
    }
    this.favShipVal.set("");
    this.favCharVal.set("");
  }

  remove(char: string, sig: WritableSignal<string[]>): void {
    sig.update(c => {
      c.splice(c.indexOf(char), 1);
      return [...c];
    });
  }

  onSubmit(form: NgForm) {
    this.snackBar.open("Saved!", undefined, { panelClass: "snack-bar", duration: 4000 });
    form.value.favoriteChars = this.favoriteCharacters();
    form.value.favoriteShip = this.favoriteShip();
    if (!form.value.element) {
      form.value.element = this.element();
    }

    this.ds.updateProfile(form.value.message, form.value.element, form.value.favoriteChars, form.value.favoriteShip);

    this.dialogRef.close(form.value);
  }



}