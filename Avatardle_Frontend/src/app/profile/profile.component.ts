import { Component, inject, signal, WritableSignal } from '@angular/core';
import { environment } from '../../environments/environment';
import { DataService } from '../services/data.service';
import { HyphenatePipe } from '../pipes/hyphenate.pipe';
import { ProfileEditDialogComponent } from '../profile-edit-dialog/profile-edit-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../services/auth.service';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-profile',
  imports: [HyphenatePipe,TranslatePipe],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css', '../leaderboard/leaderboard.component.css']
})
export class ProfileComponent {

  env = environment;
  ds: DataService = inject(DataService);
  as: AuthService = inject(AuthService);
  readonly dialog = inject(MatDialog);

  characters: string[] = [];
  isEditing: WritableSignal<boolean> = signal(false);

  favoriteChars: WritableSignal<string[]> = signal([]);
  favoriteShip: WritableSignal<string[]> = signal([]);
  element: WritableSignal<string> = signal('');
  message: WritableSignal<string> = signal('');

  discoveredCharacters: WritableSignal<number[]> = signal([]);
  discoveredCharactersCount: WritableSignal<number> = signal(0);

  username = signal<string | null>('');
  isSelf = signal<boolean>(true);

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {

    this.route.paramMap.subscribe(params => {
      this.username.set(params.get('username'));
      if (this.username() != null) {
        this.isSelf.set(false);
        this.ds.getUserProfile(this.username()!).subscribe((data) => {
  
          this.element.set(data.element.toLowerCase());
          this.favoriteChars.set(data.favorite_characters);
          this.favoriteShip.set(data.favorite_ship);
          this.message.set(data.bio);
  
          this.ds.getDiscoveredCharactersCount(this.username()!).subscribe((data: any) => {
            this.discoveredCharactersCount.set(data.count);
          });
        });
      }
      else {
        this.as.getMe().subscribe(data => {
          this.username.set(this.as.user);
          this.element.set(data.element.toLowerCase());
          this.favoriteChars.set(data.favorite_characters);
          this.favoriteShip.set(data.favorite_ship);
          this.message.set(data.bio);
        });
  
        this.ds.getDiscoveredCharacters().subscribe(data => {
          const names = (data as any[]).map(char => char.character_id);
          this.discoveredCharacters.set(names);
          this.discoveredCharactersCount.set(names.length);
        });
      }
    });

    this.characters = this.ds.characterFilter.classic['ATLA-title'].concat(this.ds.characterFilter.classic['TLOK-title']);
    
  }

  openEdit() {

    let profileData = { favChars: this.favoriteChars(), favShip: this.favoriteShip(), element: this.element(), message: this.message() };

    this.dialog.open(ProfileEditDialogComponent, { panelClass: "profile-edit-dialog", autoFocus: false, data: profileData }).afterClosed().subscribe((res) => {
      if (res != undefined) {
        if (res.element) {
          this.element.set(res.element.toLowerCase());
        }
        this.favoriteChars.set(res.favoriteChars);
        this.favoriteShip.set(res.favoriteShip);
        this.message.set(res.message);
      }
    });

  }
}
