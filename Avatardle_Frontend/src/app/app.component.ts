import { Component } from '@angular/core';
import { RouterOutlet,RouterLink } from '@angular/router';
import { Background } from './background/background.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,RouterLink, Background],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {}
