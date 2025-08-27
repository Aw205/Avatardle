import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AboutDialogComponent } from '../about-dialog/about-dialog.component';
import { HelpDialogComponent } from '../help-dialog/help-dialog.component';
import { CommentDialogComponent } from '../comment-dialog/comment-dialog.component';
import { NgParticlesService, NgxParticlesModule } from "@tsparticles/angular";
import { tsParticles } from '@tsparticles/engine';
import { loadFull } from "tsparticles";
import { DataService } from '../services/data.service';
import { AsyncPipe } from '@angular/common';
import { ParticleSettingsComponent } from '../particle-settings/particle-settings.component';
import { AvatardleProgress } from '../app.component';
import { LanguageSettingsComponent } from '../language-settings/language-settings.component';


@Component({
  selector: 'background',
  imports: [RouterLink, RouterLinkActive, NgxParticlesModule, AsyncPipe, LanguageSettingsComponent],
  templateUrl: './background.component.html',
  styleUrl: './background.component.css',
})

export class Background {

  readonly dialog = inject(MatDialog);
  readonly ds = inject(DataService);

  progress!: AvatardleProgress;
  showParticles!: boolean;
  cycleElement!: string;
  currElement!: string;

  ngOnInit() {

    let epoch = new Date(2025, 5, 25);
    epoch.setUTCHours(0, 0, 0, 0);
    let daysElapsed = Math.floor((Date.now() - epoch.valueOf()) / (1000 * 60 * 60 * 24));
    this.cycleElement = ["water", "earth", "fire", "air"][daysElapsed % 4];
    this.currElement = this.cycleElement;
    this.progress = JSON.parse(localStorage.getItem("avatardle_progress")!);
    this.showParticles = this.progress.particleSettings.enable;
  }

  async particlesInit(): Promise<void> {
    await loadFull(tsParticles);
  }

  openDialog(name: string) {

    if (name == "about") {
      let dialogRef = this.dialog.open(AboutDialogComponent, { width: '50vw', maxWidth: 'none', autoFocus: false });
    }
    else if (name == "help") {
      let dialogRef = this.dialog.open(HelpDialogComponent, { width: '70vw', maxWidth: 'none', height: "80vh", autoFocus: false });
    }
    else if (name == "comment") {
      let dialogRef = this.dialog.open(CommentDialogComponent, { width: '30vw', maxWidth: 'none', height: "50vh", autoFocus: false });
    }
    else if (name == "particle-setting") {
      let dialogRef = this.dialog.open(ParticleSettingsComponent, { width: '30vw', maxWidth: 'none', height: "80vh", data: { cycleElement: this.cycleElement, currElement: this.currElement }, autoFocus: false });

      dialogRef.afterClosed().subscribe((res) => {

        let ele = dialogRef.componentInstance.selected;
        this.showParticles = dialogRef.componentInstance.enableParticles;

        this.progress = JSON.parse(localStorage.getItem("avatardle_progress")!);
        this.progress.particleSettings.enable = this.showParticles;
        localStorage.setItem("avatardle_progress", JSON.stringify(this.progress));

        if (this.showParticles && ele != this.currElement) {
          this.showParticles = false;
          setTimeout(() => {
            this.currElement = ele;
            this.showParticles = true;
          });
        }
      });
    }

  }
}



