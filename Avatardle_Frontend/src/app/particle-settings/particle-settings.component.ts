import { Component, Inject } from '@angular/core';
import {
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';

import { FormsModule } from '@angular/forms';
import { AvatardleProgress } from '../app.component';


@Component({
  selector: 'particle-settings',
  imports: [MatDialogActions, MatDialogContent, MatDialogTitle, FormsModule],
  templateUrl: './particle-settings.component.html',
  styleUrl: './particle-settings.component.css'
})
export class ParticleSettingsComponent {

  selected: string = "";
  cycleElement: string = "";
  enableParticles!: boolean;
  progress: AvatardleProgress;

  particleSettings = { disable: null }

  constructor(public dialogRef: MatDialogRef<ParticleSettingsComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {

    this.cycleElement = data.cycleElement;
    this.selected = data.currElement;
    this.progress = JSON.parse(localStorage.getItem("avatardle_progress")!);
    this.enableParticles = this.progress.particleSettings.enable;
    this.progress.particleSettings.customElement = this.selected;
    localStorage.setItem("avatardle_progress", JSON.stringify(this.progress));
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onClick(element: string) {

    this.selected = element;
    let progress: AvatardleProgress = JSON.parse(localStorage.getItem("avatardle_progress")!);
    progress.particleSettings.customElement = this.selected;
    localStorage.setItem("avatardle_progress", JSON.stringify(progress));
  }

  onChange(event: any, type: string) {

    if (type == "enable") {
      let progress: AvatardleProgress = JSON.parse(localStorage.getItem("avatardle_progress")!);
      progress.particleSettings.enable = event.target.checked;
      localStorage.setItem("avatardle_progress", JSON.stringify(progress));
    }
  }

}
