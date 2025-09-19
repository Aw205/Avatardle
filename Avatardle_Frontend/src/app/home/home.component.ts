import { Component, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from "@ngx-translate/core";

@Component({
    selector: 'home',
    imports: [RouterLink, RouterLinkActive, TranslatePipe],
    templateUrl: './home.component.html',
    styleUrl: './home.component.css'
})
export class HomeComponent {

    title: Title = inject(Title);
    meta: Meta = inject(Meta);

    ngOnInit() {
        this.title.setTitle("Avatardle - Home");
        this.meta.updateTag({
            name: "description",
            content: "A daily guessing game based on Avatar: The Last Airbender and The Legend of Korra. Guess characters, quotes, and episodes from the show!"
        });
    }

}
