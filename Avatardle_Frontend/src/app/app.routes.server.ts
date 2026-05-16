import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '',
    renderMode: RenderMode.Prerender
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
  },
  {
    path: 'leaderboard',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'profile',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'users/:username',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
