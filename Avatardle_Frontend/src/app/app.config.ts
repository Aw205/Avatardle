import { ApplicationConfig, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import {provideTranslateService, provideTranslateLoader} from "@ngx-translate/core";
import {provideTranslateHttpLoader} from "@ngx-translate/http-loader";

import { routes } from './app.routes';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { DataService } from './services/data.service';
import { AvatardleProgress } from './app.component';


let progress: AvatardleProgress = JSON.parse(localStorage.getItem("avatardle_progress")!);

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), provideHttpClient(),

  provideAppInitializer(() => {
    let ds = inject(DataService);
    return ds.initialize();
  }),
  provideTranslateService({
    loader: provideTranslateHttpLoader({
      prefix: '/json/i18n/',
      suffix: '.json'
    }),
    fallbackLang: 'en',
    lang: (progress?.language ?? navigator.language.split("-")[0])
  })
  ]
};
