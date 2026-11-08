import { Component, DestroyRef, inject, signal, WritableSignal, PLATFORM_ID, Inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgParticlesService, NgxParticlesModule } from "@tsparticles/angular";
import { loadFull } from "tsparticles";
import { loadShadowEffect } from '@tsparticles/effect-shadow'; 
import { DataService } from '../services/data.service';
import { AsyncPipe, isPlatformBrowser } from '@angular/common';
import { LanguageSettingsComponent } from '../language-settings/language-settings.component';
import { LocalStorageService } from '../services/local-storage.service';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '../services/auth.service';
import { TranslatePipe } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ComponentType } from '@angular/cdk/portal';

type StaticDialog = 'about' | 'help' | 'signup' | 'comment' | 'notes';
const dialogs: Record<StaticDialog, { load: () => Promise<ComponentType<unknown>>; panelClass: string }> = {
  about: { load: () => import('../about-dialog/about-dialog.component').then(m => m.AboutDialogComponent), panelClass: 'about-dialog' },
  help: { load: () => import('../help-dialog/help-dialog.component').then(m => m.HelpDialogComponent), panelClass: 'help-dialog' },
  signup: { load: () => import('../auth-dialog/auth-dialog.component').then(m => m.AuthDialogComponent), panelClass: 'signup-dialog' },
  comment: { load: () => import('../comment-dialog/comment-dialog.component').then(m => m.CommentDialogComponent), panelClass: 'comment-dialog' },
  notes: { load: () => import('../notes-dialog/notes-dialog.component').then(m => m.NotesDialogComponent), panelClass: 'notes-dialog' }
};

@Component({
  selector: 'background',
  imports: [RouterLink, RouterLinkActive, NgxParticlesModule, AsyncPipe, LanguageSettingsComponent, MatMenuModule, MatBadgeModule, TranslatePipe],
  templateUrl: './background.component.html',
  styleUrl: './background.component.css'
})

export class Background {

  readonly dialog = inject(MatDialog);
  readonly ds = inject(DataService);
  readonly ls = inject(LocalStorageService);
  readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private particleTimer?: ReturnType<typeof setTimeout>;
  private readonly ngParticlesService = inject(NgParticlesService);

  showParticles: WritableSignal<boolean> = signal(true);
  cycleElement!: string;
  currElement!: string;

  notesNotif: WritableSignal<boolean> = signal(false);
  pageNotFound: boolean = false;

  constructor(@Inject(PLATFORM_ID) private platformId: object) { }

  ngOnInit() {

    if (isPlatformBrowser(this.platformId)) {
      this.ngParticlesService.init(async engine => {
        await loadShadowEffect(engine);
        await loadFull(engine);
      });
      this.showParticles.set(this.ls.progress().particleSettings.enable);
      this.notesNotif.set(this.ls.progress().notesNotif);
    }

    let epoch = new Date(2025, 5, 25);
    epoch.setUTCHours(0, 0, 0, 0);
    let daysElapsed = Math.floor((Date.now() - epoch.valueOf()) / (1000 * 60 * 60 * 24));
    this.cycleElement = ["water", "earth", "fire", "air"][daysElapsed % 4];
    this.currElement = this.cycleElement;

    this.ds.pageNotFound$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((val) => {
      this.pageNotFound = val;
    });

  }

  async openDialog(name: StaticDialog | 'particle-setting') {
    if (name === 'particle-setting') {
      await this.openParticleSettings();
      return;
    }
    if (name === 'notes') {
      this.notesNotif.set(false);
      this.ls.patch(['notesNotif'], false);
    }
    const { load, panelClass } = dialogs[name];
    const component = await load();
    if (!this.destroyRef.destroyed) this.dialog.open(component, { panelClass, autoFocus: false });
  }

  private async openParticleSettings() {
    const { ParticleSettingsComponent } = await import('../particle-settings/particle-settings.component');
    if (this.destroyRef.destroyed) return;
    const dialogRef = this.dialog.open(ParticleSettingsComponent, {
      panelClass: 'particles-dialog', autoFocus: false,
      data: { cycleElement: this.cycleElement, currElement: this.currElement }
    });
    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      const { selected, enableParticles } = dialogRef.componentInstance;
      const enabled = enableParticles();
      clearTimeout(this.particleTimer);
      this.showParticles.set(enabled);
      this.ls.patch(['particleSettings', 'enable'], enabled);
      if (selected === this.currElement) return;

      if (enabled) {
        this.showParticles.set(false);
        this.particleTimer = setTimeout(() => {
          this.currElement = selected;
          this.showParticles.set(true);
        });
      } else {
        this.currElement = selected;
      }
    });
  }

  ngOnDestroy() {
    clearTimeout(this.particleTimer);
  }
}
