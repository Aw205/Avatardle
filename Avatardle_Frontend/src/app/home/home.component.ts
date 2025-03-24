import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
    selector: 'home',
    imports: [RouterLink, RouterLinkActive],
    templateUrl: './home.component.html',
    styleUrl: './home.component.css'
})
export class HomeComponent {}
