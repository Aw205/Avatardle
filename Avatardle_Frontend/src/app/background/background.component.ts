import { Component, inject, signal, WritableSignal, PLATFORM_ID, Inject, afterNextRender } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AboutDialogComponent } from '../about-dialog/about-dialog.component';
import { HelpDialogComponent } from '../help-dialog/help-dialog.component';
import { CommentDialogComponent } from '../comment-dialog/comment-dialog.component';
import { NgxParticlesModule } from "@tsparticles/angular";
import { tsParticles } from '@tsparticles/engine';
import { loadFull } from "tsparticles";
import { DataService } from '../services/data.service';
import { AsyncPipe, isPlatformBrowser } from '@angular/common';
import { ParticleSettingsComponent } from '../particle-settings/particle-settings.component';
import { LanguageSettingsComponent } from '../language-settings/language-settings.component';
import { LocalStorageService } from '../services/local-storage.service';


@Component({
  selector: 'background',
  imports: [RouterLink, RouterLinkActive, NgxParticlesModule, AsyncPipe, LanguageSettingsComponent],
  templateUrl: './background.component.html',
  styleUrl: './background.component.css',
})

export class Background {

  readonly dialog = inject(MatDialog);
  readonly ds = inject(DataService);
  readonly ls = inject(LocalStorageService);

  showParticles: WritableSignal<boolean> = signal(true);
  cycleElement!: string;
  currElement!: string;


  constructor(@Inject(PLATFORM_ID) private platformId: object) {

    afterNextRender(() => {
      this.showParticles.set(this.ls.progress.particleSettings.enable);
    })
  }

  ngOnInit() {

    let epoch = new Date(2025, 5, 25);
    epoch.setUTCHours(0, 0, 0, 0);
    let daysElapsed = Math.floor((Date.now() - epoch.valueOf()) / (1000 * 60 * 60 * 24));
    this.cycleElement = ["water", "earth", "fire", "air"][daysElapsed % 4];
    this.currElement = this.cycleElement;

  }

  async particlesInit(): Promise<void> {

    if (isPlatformBrowser(this.platformId)) {
      await loadFull(tsParticles);
    }

  }

  openDialog(name: string) {

    if (name == "about") {
      this.dialog.open(AboutDialogComponent, { width: '50vw', maxWidth: 'none', autoFocus: false });
    }
    else if (name == "help") {
      this.dialog.open(HelpDialogComponent, { width: '70vw', maxWidth: 'none', height: "80vh", autoFocus: false });
    }
    else if (name == "comment") {
      this.dialog.open(CommentDialogComponent, { width: '30vw', maxWidth: 'none', height: "50vh", autoFocus: false });
    }
    else if (name == "particle-setting") {
      let dialogRef = this.dialog.open(ParticleSettingsComponent, { width: '30vw', maxWidth: 'none', height: "80vh", data: { cycleElement: this.cycleElement, currElement: this.currElement }, autoFocus: false });

      dialogRef.afterClosed().subscribe((res) => {

        let ele = dialogRef.componentInstance.selected;
        this.showParticles.set(dialogRef.componentInstance.enableParticles());

        this.ls.progress.particleSettings.enable = this.showParticles();
        this.ls.update();

        if (this.showParticles() && ele != this.currElement) {
          this.showParticles.set(false);
          setTimeout(() => {
            this.currElement = ele;
            this.showParticles.set(true);
          });
        }
      });
    }

  }
}



