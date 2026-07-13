import { Component } from '@angular/core';
import { RouterOutlet,RouterLink } from '@angular/router';
import { Background } from './background/background.component';
import { TranslatePipe } from "@ngx-translate/core";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,RouterLink, Background,TranslatePipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {}
