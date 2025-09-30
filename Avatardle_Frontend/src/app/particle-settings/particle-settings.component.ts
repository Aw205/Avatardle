import { afterNextRender, Component, inject, Inject, signal, WritableSignal } from '@angular/core';
import { MatDialogTitle, MatDialogContent, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from "@ngx-translate/core";
import { LocalStorageService } from '../services/local-storage.service';

@Component({
  selector: 'particle-settings',
  imports: [MatDialogContent, MatDialogTitle, FormsModule, TranslatePipe],
  templateUrl: './particle-settings.component.html',
  styleUrl: './particle-settings.component.css'
})
export class ParticleSettingsComponent {

  selected: string = "";
  cycleElement: string = "";
  enableParticles: WritableSignal<boolean> = signal(true);
  ls: LocalStorageService = inject(LocalStorageService);

  constructor(public dialogRef: MatDialogRef<ParticleSettingsComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {

    this.cycleElement = data.cycleElement;
    this.selected = data.currElement;

    afterNextRender(() => {
      this.enableParticles.set(this.ls.progress.particleSettings.enable);
    })
  }
  
  onClick(element: string) {
    this.selected = element;
  }

  onChange(event: any, type: string) {
    if (type == "enable") {
      this.enableParticles.set(event.target.checked);
    }
  }

}
