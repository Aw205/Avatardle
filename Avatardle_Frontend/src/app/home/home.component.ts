import { Component, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from "@ngx-translate/core";

@Component({
    selector: 'home',
    imports: [RouterLink, RouterLinkActive, TranslatePipe],
    templateUrl: './home.component.html',
    styleUrl: './home.component.css'
})
export class HomeComponent {
    readonly modes = [
        { id: 'classic', tileX: 0, marker: 'left' },
        { id: 'quote', tileX: 186, marker: null },
        { id: 'picture', tileX: 372, marker: 'right' },
        { id: 'music', tileX: 1116, marker: null }
    ];

    title: Title = inject(Title);
    meta: Meta = inject(Meta);

    ngOnInit() {
        this.title.setTitle("Avatardle | Daily Avatar Guessing Game");
        this.meta.updateTag({
            name: "description",
            content: "A daily guessing game based on Avatar: The Last Airbender and The Legend of Korra. Guess characters, quotes, music, and scenes from the show!"
        });
    }

}
