import { Component, inject, Inject, signal } from '@angular/core';
import { MatDialogTitle, MatDialogContent, MatDialogClose, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslatePipe } from "@ngx-translate/core";
import { LocalStorageService } from '../services/local-storage.service';

interface ParticleSettingsData {
  cycleElement: string;
  currElement: string;
}

@Component({
  selector: 'particle-settings',
  imports: [MatDialogContent, MatDialogTitle, MatDialogClose, TranslatePipe],
  templateUrl: './particle-settings.component.html',
  styleUrls: ['../shared/dialog-theme.css', '../shared/dialog-buttons.css', './particle-settings.component.css']
})
export class ParticleSettingsComponent {

  readonly elements = [
    { id: 'water', label: 'Water' },
    { id: 'earth', label: 'Earth' },
    { id: 'air', label: 'Air' },
    { id: 'fire', label: 'Fire' }
  ];

  get cycleElementLabel(): string {
    return this.elements.find(element => element.id === this.cycleElement)?.label ?? '';
  }

  selected: string = "";
  cycleElement: string = "";
  readonly enableParticles = signal(true);
  ls = inject(LocalStorageService);

  constructor(@Inject(MAT_DIALOG_DATA) data: ParticleSettingsData) {
    this.cycleElement = data.cycleElement;
    this.selected = data.currElement;
    this.enableParticles.set(this.ls.progress().particleSettings.enable);
  }

  selectElement(element: string) {
    this.selected = element;
  }

  setEnabled(event: Event) {
    this.enableParticles.set((event.target as HTMLInputElement).checked);
  }
}
