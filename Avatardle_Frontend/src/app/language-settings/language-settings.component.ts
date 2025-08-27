import { Component } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { TranslateService } from '@ngx-translate/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AvatardleProgress } from '../app.component';
@Component({
  selector: 'language-settings',
  imports: [MatMenuModule, TranslatePipe],
  templateUrl: './language-settings.component.html',
  styleUrl: './language-settings.component.css'
})
export class LanguageSettingsComponent {

  languages: { name: string, code: string }[] = [

    { name: "Deutsch", code: "de" },
    { name: "English", code: "en" },
    { name: "Español", code: "es" },
    { name: "Français", code: "fr" },
    { name: "Português", code: "pt" }
  ];
  currLang = "";

  constructor(private ts: TranslateService) {
  }

  onMenuOpen() {
    this.currLang = this.ts.getCurrentLang();
  }

  setLanguage(code: string) {

    let progress: AvatardleProgress = JSON.parse(localStorage.getItem("avatardle_progress")!);
    progress.language = code;
    localStorage.setItem("avatardle_progress", JSON.stringify(progress));
    this.ts.use(code);
  }

}
