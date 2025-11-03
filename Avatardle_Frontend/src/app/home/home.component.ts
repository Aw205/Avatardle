import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from "@ngx-translate/core";

@Component({
    selector: 'home',
    imports: [RouterLink, RouterLinkActive, TranslatePipe],
    templateUrl: './home.component.html',
    styleUrl: './home.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {

}
