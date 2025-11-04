import { Component, inject } from '@angular/core';
import { DataService } from '../services/data.service';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-not-found',
  imports: [],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.css'
})
export class NotFoundComponent {

  ds = inject(DataService);
  title = inject(Title);
  meta = inject(Meta);

  ngOnInit() {

    this.title.setTitle('404 | Page Not Found');
    this.meta.addTag({ name: 'robots', content: 'noindex, nofollow' });

    this.ds.pageNotFound$.next(true);
  }
  ngOnDestroy(): void {
    this.ds.pageNotFound$.next(false);
  }
}
