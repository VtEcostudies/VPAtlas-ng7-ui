// ###########################################
// Popup component
// ###########################################
import { Component, OnInit } from "@angular/core";
@Component({
    selector: "popup",
    template: `<section class="popup">Popup Component! :D {{ param }}</section>`
})
export class PopupComponent {
  param: any;
}
