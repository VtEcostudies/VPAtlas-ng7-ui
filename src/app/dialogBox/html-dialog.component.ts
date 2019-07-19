import { Component, OnInit } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'html-dialog',
  templateUrl: './html-dialog.component.html',
})
export class HtmlDialog {
  htmlContent: string;
}
