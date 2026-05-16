import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { authGuard } from './guards/auth.guard';

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
   },
   {
      path: 'music',
      loadComponent: () => import('./music/music.component').then(module => module.MusicMode)
   },
   {
      path: 'leaderboard',
      loadComponent: () => import('./leaderboard/leaderboard.component').then(module => module.LeaderboardComponent)
   },
   {
      path: 'profile',
      loadComponent: () => import('./profile/profile.component').then(module => module.ProfileComponent),
      canActivate: [authGuard]
   },
   {
      path: 'users/:username',
      loadComponent: () => import('./profile/profile.component').then(module => module.ProfileComponent)
   },
   { path: '**', loadComponent: () => import('./not-found/not-found.component').then(module => module.NotFoundComponent) }
];
