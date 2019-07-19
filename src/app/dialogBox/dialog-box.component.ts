import {Component, Input, Inject} from '@angular/core';
import {MatDialog, MAT_DIALOG_DATA} from '@angular/material/dialog';

export interface DialogData {
  title: 'title';
  text: 'text';
}

/**
 * @title Injecting data when opening a dialog
 */
@Component({
  selector: 'dialog-box',
  templateUrl: 'dialog-box.html',
  styleUrls: ['dialog-box.css'],
})
export class DialogBox {

  @Input() dialogValues = {title: 'Title', text: 'Text'};

  constructor(public dialog: MatDialog) {}

  openDialog() {
    this.dialog.open(DialogBoxDialog, {
      data: this.dialogValues
    });
  }
}

@Component({
  selector: 'dialog-box-dialog',
  templateUrl: 'dialog-box-dialog.html',
})
export class DialogBoxDialog {
  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData) {}
}
