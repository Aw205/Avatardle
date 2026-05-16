import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { AuthDialogComponent } from '../auth-dialog/auth-dialog.component';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const dialog = inject(MatDialog);
  if (auth.isLoggedIn()) {
    return true;
  }
  dialog.open(AuthDialogComponent, { panelClass: "signup-dialog", autoFocus: false });
  return router.createUrlTree(['/']);
};
