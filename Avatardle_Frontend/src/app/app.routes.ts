import { Routes } from '@angular/router';
import { ClassicMode } from './classic/classic.component';
import { PictureMode } from './picture/picture.component';
import { QuoteMode } from './quote/quote.component';
import { HomeComponent } from './home/home.component';

export const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: HomeComponent },
    { path: 'classic', component: ClassicMode },
    { path: 'quote', component: QuoteMode },
    { path: 'picture', component: PictureMode },
];
