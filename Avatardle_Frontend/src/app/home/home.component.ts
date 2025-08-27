import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {TranslatePipe} from "@ngx-translate/core";

@Component({
    selector: 'home',
    imports: [RouterLink, RouterLinkActive,TranslatePipe],
    templateUrl: './home.component.html',
    styleUrl: './home.component.css'
})
export class HomeComponent {}
