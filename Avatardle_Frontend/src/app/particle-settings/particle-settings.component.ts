import { Component, Inject } from '@angular/core';
import {
  MatDialogTitle,
  MatDialogContent,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';

import { FormsModule } from '@angular/forms';
import {TranslatePipe} from "@ngx-translate/core";
import { AvatardleProgress } from '../app.component';


@Component({
  selector: 'particle-settings',
  imports: [MatDialogContent, MatDialogTitle, FormsModule,TranslatePipe],
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
    localStorage.setItem("avatardle_progress", JSON.stringify(this.progress));
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onClick(element: string) {
    this.selected = element;
  }

  onChange(event: any, type: string) {

    if (type == "enable") {
      this.enableParticles = event.target.checked;
    }
  }

}
