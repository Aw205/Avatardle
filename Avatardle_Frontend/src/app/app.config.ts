import { ApplicationConfig, inject, provideAppInitializer, provideZonelessChangeDetection, REQUEST } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from "@ngx-translate/core";
import { provideTranslateHttpLoader } from "@ngx-translate/http-loader";
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { DataService } from './services/data.service';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { AuthService } from './services/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [provideZonelessChangeDetection(), provideRouter(routes), provideHttpClient(),
  provideAppInitializer(() => {
    let ds = inject(DataService);
    return ds.initialize();
  }),
  provideAppInitializer(() => {
    let as = inject(AuthService);
    return as.initialize();
  }),
  provideTranslateService({
    loader: provideTranslateHttpLoader({
      prefix: '/json/i18n/',
      suffix: '.json'
    }),
    fallbackLang: 'en'
  }),
  provideClientHydration(withEventReplay())
  ]
};
