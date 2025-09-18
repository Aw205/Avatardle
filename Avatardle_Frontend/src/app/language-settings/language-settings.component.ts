import { Component, inject } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { TranslateService } from '@ngx-translate/core';
import { TranslatePipe } from '@ngx-translate/core';
import { LocalStorageService } from '../services/local-storage.service';

@Component({
  selector: 'language-settings',
  imports: [MatMenuModule, TranslatePipe],
  templateUrl: './language-settings.component.html',
  styleUrl: './language-settings.component.css'
})
export class LanguageSettingsComponent {

  ls: LocalStorageService = inject(LocalStorageService);
  ts: TranslateService = inject(TranslateService);
  currLang: string = "";
  languages: { name: string, code: string }[] = [
    { name: "Deutsch", code: "de" },
    { name: "English", code: "en" },
    { name: "Español", code: "es" },
    { name: "Français", code: "fr" },
    { name: "Português", code: "pt" }
  ];

  onMenuOpen() {
    this.currLang = this.ts.getCurrentLang();
  }

  setLanguage(code: string) {
    this.ls.progress.language = code;
    this.ls.update();
    this.ts.use(code);
  }

}
