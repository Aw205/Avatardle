import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-expand-image-dialog',
  imports: [TranslatePipe],
  templateUrl: './expand-image-dialog.component.html',
  styleUrl: './expand-image-dialog.component.css'
})
export class ExpandImageDialogComponent {

  constructor(public dialogRef: MatDialogRef<ExpandImageDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any) { }

}
