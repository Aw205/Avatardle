import { Component, computed, DestroyRef, inject, signal, WritableSignal } from '@angular/core';
import { environment } from '../../environments/environment';
import { DataService } from '../services/data.service';
import { HyphenatePipe } from '../pipes/hyphenate.pipe';
import { ProfileEditData, ProfileEditDialogComponent } from '../profile-edit-dialog/profile-edit-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../services/auth.service';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, combineLatest, EMPTY, merge, switchMap, tap } from 'rxjs';

interface ScrollPortrait {
  revealId: number;
  id: number;
  name: string;
  src: string;
  inscription: string;
  seal: Record<string, string>;
}

@Component({
  selector: 'app-profile',
  imports: [HyphenatePipe, TranslatePipe, MatTooltipModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css', './profile-library.css', './profile-reveal.css', '../shared/character-headshots.css']
})
export class ProfileComponent {
  private static nextInkInstance = 0;
  readonly inkMaskPrefix = `profile-ink-${ProfileComponent.nextInkInstance++}`;
  private revealSequence = 0;
  private readonly destroyRef = inject(DestroyRef);

  env = environment;
  ds: DataService = inject(DataService);
  as: AuthService = inject(AuthService);
  dialog: MatDialog = inject(MatDialog);
  private inscriptions = new Map<string, string>();

  readonly characters = [
    ...this.ds.characterFilter.classic['ATLA-title'],
    ...this.ds.characterFilter.classic['TLOK-title'],
    ...this.ds.characterFilter.classic['AATLA-title']
  ];

  favoriteChars: WritableSignal<string[]> = signal([]);
  favoriteShip: WritableSignal<string[]> = signal([]);
  element: WritableSignal<string> = signal('');
  message: WritableSignal<string> = signal('');

  discoveredCharacters: WritableSignal<number[]> = signal([]);
  discoveredCharactersCount: WritableSignal<number> = signal(0);
  selectedCharacterId: WritableSignal<number | null> = signal(null);
  readonly selectedCharacterName = computed(() => {
    const id = this.selectedCharacterId();
    return id === null ? '' : this.characters[id - 1] ?? '';
  });
  readonly pendingPortrait = signal<ScrollPortrait | null>(null);
  // A keyed, single-entry list restarts SVG/CSS animations even for repeat clicks.
  readonly displayedPortraits = signal<ScrollPortrait[]>([]);
  readonly previousPortrait = signal<ScrollPortrait | null>(null);
  readonly artworkUnavailable = signal(false);

  username = signal<string | null>('');
  isSelf = signal<boolean>(true);

  constructor(private route: ActivatedRoute) { }

  ngOnInit() {
    combineLatest([this.route.paramMap, this.ds.characterInscriptions$]).pipe(
      switchMap(([params, inscriptions]) => {
        this.inscriptions = new Map(Object.entries(inscriptions).map(([name, entry]) => [name.toLowerCase(), entry.inscription]));
        const username = params.get('username');
        this.resetProfile(username);

        const profile$ = (username === null ? this.as.getMe() : this.ds.getUserProfile(username)).pipe(
          tap(data => {
            if (username === null) this.username.set(data.username ?? this.as.user);
            this.element.set(data.element.toLowerCase());
            this.favoriteChars.set(data.favorite_characters);
            this.favoriteShip.set(data.favorite_ship);
            this.message.set(data.bio);
          }),
          catchError(() => EMPTY)
        );
        const discoveries$ = username === null
          ? this.ds.getDiscoveredCharacters().pipe(tap(data => {
              const ids = data.map(character => character.character_id);
              this.discoveredCharacters.set(ids);
              this.discoveredCharactersCount.set(ids.length);
              if (ids.length) this.selectCharacter(ids[0]);
            }), catchError(() => EMPTY))
          : this.ds.getDiscoveredCharactersCount(username).pipe(tap(data => {
              this.discoveredCharactersCount.set(Number(data.count));
            }), catchError(() => EMPTY));

        // Changing routes cancels both requests before they can update another profile.
        return merge(profile$, discoveries$);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  private resetProfile(username: string | null) {
    this.username.set(username);
    this.isSelf.set(username === null);
    this.element.set('');
    this.favoriteChars.set([]);
    this.favoriteShip.set([]);
    this.message.set('');
    this.discoveredCharactersCount.set(0);
    this.discoveredCharacters.set([]);
    this.selectedCharacterId.set(null);
    this.pendingPortrait.set(null);
    this.displayedPortraits.set([]);
    this.previousPortrait.set(null);
    this.artworkUnavailable.set(false);
  }

  openEdit() {
    const data: ProfileEditData = {
      favoriteCharacters: this.favoriteChars(),
      favoriteShip: this.favoriteShip(),
      element: this.element(),
      message: this.message()
    };
    this.dialog.open<ProfileEditDialogComponent, ProfileEditData, ProfileEditData>(ProfileEditDialogComponent, {
      panelClass: 'profile-edit-dialog', autoFocus: false, data
    }).afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      if (!result) return;
      this.element.set(result.element.toLowerCase());
      this.favoriteChars.set(result.favoriteCharacters);
      this.favoriteShip.set(result.favoriteShip);
      this.message.set(result.message);
    });
  }

  readonly discoveryCount = computed(() =>
    Math.min(this.characters.length, Math.max(0, this.discoveredCharactersCount() || 0)));

  readonly discoveryProgress = computed(() =>
    this.characters.length ? this.discoveryCount() / this.characters.length * 100 : 0);

  readonly discoveryPercentage = computed(() => Math.round(this.discoveryProgress()));

  readonly discoveryMilestones = computed(() => {
    const total = this.characters.length;
    if (!total) return [];
    const count = this.discoveryCount();
    return [
      { id: 'first', label: 'profile.milestones.first', target: 1 },
      { id: 'collector', label: 'profile.milestones.collector', target: Math.ceil(total / 4) },
      { id: 'scholar', label: 'profile.milestones.scholar', target: Math.ceil(total / 2) },
      { id: 'archivist', label: 'profile.milestones.archivist', target: total }
    ].map(milestone => ({
      ...milestone,
      earned: count >= milestone.target,
      remaining: Math.max(0, milestone.target - count)
    }));
  });

  readonly nextDiscoveryMilestone = computed(() => this.discoveryMilestones().find(milestone => !milestone.earned));

  selectCharacter(characterId: number) {
    const name = this.characters[characterId - 1];
    if (!name || !this.discoveredCharacters().includes(characterId) || this.pendingPortrait()?.id === characterId) {
      return;
    }
    this.selectedCharacterId.set(characterId);
    this.artworkUnavailable.set(false);
    this.pendingPortrait.set({
      revealId: ++this.revealSequence,
      id: characterId,
      name,
      src: `${this.env.r2AssetUrl}/ink-art/${encodeURIComponent(name.replace(/\s+/g, '_'))}.webp`,
      inscription: this.inscriptions.get(name.toLowerCase()) ?? '',
      seal: this.getSealStyle(name)
    });
  }

  async revealPortrait(event: Event, portrait: ScrollPortrait) {
    const image = event.target as HTMLImageElement;
    try {
      await image.decode();
    } catch {
      if (!image.naturalWidth) {
        this.portraitFailed(portrait);
        return;
      }
    }
    // A slow earlier image must never replace a more recent selection.
    if (this.destroyRef.destroyed || this.pendingPortrait() !== portrait) {
      return;
    }
    this.previousPortrait.set(this.displayedPortraits()[0] ?? null);
    this.displayedPortraits.set([portrait]);
    this.pendingPortrait.set(null);
  }

  portraitFailed(portrait: ScrollPortrait) {
    if (this.destroyRef.destroyed || this.pendingPortrait() !== portrait) {
      return;
    }
    this.pendingPortrait.set(null);
    this.displayedPortraits.set([]);
    this.previousPortrait.set(null);
    this.artworkUnavailable.set(true);
  }

  clearPreviousPortrait(portrait: ScrollPortrait) {
    if (this.previousPortrait() === portrait) {
      this.previousPortrait.set(null);
    }
  }

  private getSealStyle(characterName: string): Record<string, string> {
    const seed = this.hashCharacterName(characterName);
    const rightOffset = 9.5 + (seed % 5) * 0.15;
    const bottomOffset = 9.5 + (Math.floor(seed / 10) % 5) * 0.15;
    const rotation = -3 + (Math.floor(seed / 100) % 7);

    return {
      '--seal-right': `${rightOffset.toFixed(2)}%`,
      '--seal-bottom': `${bottomOffset.toFixed(2)}%`,
      '--seal-rotation': `${rotation}deg`
    };
  }

  private hashCharacterName(characterName: string): number {
    let hash = 0;
    for (let i = 0; i < characterName.length; i++) {
      hash = ((hash << 5) - hash + characterName.charCodeAt(i)) >>> 0;
    }
    return hash;
  }

}
