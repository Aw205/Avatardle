import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { pictureResolver } from './picture.resolver';

export const routes: Routes = [
   { path: '', component: HomeComponent},
   {
      path: 'classic',
      loadComponent: () => import('./classic/classic.component').then(module => module.ClassicMode)
   },
   {
      path: 'quote',
      loadComponent: () => import('./quote/quote.component').then(module => module.QuoteMode)
   },
   {
      path: 'picture',
      loadComponent: () => import('./picture/picture.component').then(module => module.PictureMode),
      resolve: { image: pictureResolver }
   },
   {
      path: 'music',
      loadComponent: () => import('./music/music.component').then(module => module.MusicMode)
   },
   {
      path: 'leaderboard',
      loadComponent: () => import('./leaderboard/leaderboard.component').then(module => module.LeaderboardComponent)
   },
   { path: '**', loadComponent: () => import('./not-found/not-found.component').then(module => module.NotFoundComponent) }
];
