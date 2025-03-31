import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { pictureResolver } from './picture.resolver';

export const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: HomeComponent },
    { path: 'classic', 
        loadComponent: () => import('./classic/classic.component').then(module => module.ClassicMode)
     },
     { path: 'quote', 
        loadComponent: () => import('./quote/quote.component').then(module => module.QuoteMode)
     },
     { path: 'picture', 
        loadComponent: () => import('./picture/picture.component').then(module => module.PictureMode),
        resolve: {image: pictureResolver}
     },
];
