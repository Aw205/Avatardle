import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'home',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'classic',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'quote',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'picture',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'music',
    renderMode: RenderMode.Prerender
  }
];
