import { Component } from '@angular/core';
import { MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'help-dialog',
  imports: [MatDialogTitle, MatDialogContent, MatDialogClose, MatTabsModule, TranslatePipe],
  templateUrl: './help-dialog.component.html',
  styleUrls: ['../shared/dialog-theme.css', './help-dialog.component.css']
})
export class HelpDialogComponent {

}
