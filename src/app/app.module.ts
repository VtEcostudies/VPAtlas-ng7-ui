import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
//import { MatDatepickerModule, MatInputModule, MatNativeDateModule } from '@angular/material';
//import { MatDialogModule } from '@angular/material/dialog';
import {
  MatButtonModule,
  MatDialogModule,
  MatFormFieldModule,
  MatIconModule,
  MatInputModule
} from '@angular/material';

// used to create fake backend
// NOTE: this could be used as a local database option
import { fakeBackendProvider } from './_helpers';

import { AppComponent } from './app.component';
import { routing } from './app.routing';

//@add_component_here
import { AlertComponent } from './_components';
import { JwtInterceptor, ErrorInterceptor } from './_helpers';
import { HomeComponent } from './home';
import { LoginComponent } from './login';
import { RegisterComponent } from './register';
import { AdminComponent } from './admin';

import { LeafletComponent } from './_components'; //hope to replace vpMapLeafletComponent later

import { vpMapListComponent } from './vpmapped';
import { vpMapViewComponent } from './vpmapped';
import { vpMapCreateComponent } from './vpmapped';

import { vpVisitListComponent } from './vpvisit';
import { vpVisitViewComponent } from './vpvisit';
import { vpVisitCreateComponent } from './vpvisit';

import { vpListComponent } from './vppools';
import { vpViewComponent } from './vppools';

import { DialogBox, DialogBoxDialog } from './dialogBox';
import { HtmlDialog, HtmlDialogApp } from './dialogBox';

@NgModule({
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        ReactiveFormsModule,
        FormsModule,
        //MatDatepickerModule, MatInputModule, MatNativeDateModule,
        MatDialogModule,
        HttpClientModule,
        routing
    ],
    //@add_component_here
    declarations: [
        AppComponent,
        AlertComponent,
        HomeComponent,
        LoginComponent,
        RegisterComponent,
        AdminComponent,

        vpMapListComponent,
        vpMapViewComponent,
        vpMapCreateComponent,

        LeafletComponent,
        DialogBox,
        DialogBoxDialog,
        HtmlDialog,
        HtmlDialogApp,

        vpVisitListComponent,
        vpVisitViewComponent,
        vpVisitCreateComponent,

        vpListComponent,
        vpViewComponent,
    ],
    providers: [
        { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
        //{ provide: MAT_DIALOG_DATA, useClass: HtmlDialog, multi: true }, //bugfix attempt: ERROR TypeError: "this._portalOutlet is undefined"
        // provider used to create fake backend
        //fakeBackendProvider
    ],
    bootstrap: [AppComponent],
    entryComponents: [
      DialogBox,
      DialogBoxDialog,
      HtmlDialog,
      //HtmlDialogApp //bugfix attempt: ERROR TypeError: "this._portalOutlet is undefined"
    ]
})

export class AppModule { }
