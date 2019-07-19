import {Component, Input, Inject} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { SecurityContext } from '@angular/core';
import { HtmlDialog } from './html-dialog.component';

@Component({
  selector: 'html-dialog-app',
  templateUrl: 'html-dialog-app.component.html',
  styleUrls: ['html-dialog-app.css']
})

export class HtmlDialogApp {

  @Input() htmlContent: string = '<h3>Default Header</h3><p>Default content...</p>'; //make it @input so we can set it on each call...

  constructor(private dialog: MatDialog, private dom: DomSanitizer){}

  openDialog() {
    let dialogRef = this.dialog.open(HtmlDialog);
    dialogRef.componentInstance.htmlContent = this.dom.sanitize(SecurityContext.HTML, this.htmlContent);
  }
}
