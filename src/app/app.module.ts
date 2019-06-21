import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

//import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
//import { MatDatepickerModule, MatInputModule, MatNativeDateModule } from '@angular/material';

// used to create fake backend
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

import { vpMapListComponent } from './vpmapped';
import { vpMapViewComponent } from './vpmapped';
import { vpMapCreateComponent } from './vpmapped';
import { vpMapLeafletComponent } from './vpmapped';

import { LeafletComponent } from './_components'; //hope to replace vpMapLeafletComponent later
import { LeafletViewComponent } from './_components'; //hope to replace vpMapLeafletComponent later
import { LeafletEditComponent } from './_components'; //hope to replace vpMapLeafletComponent later

import { vpVisitListComponent } from './vpvisit';
import { vpVisitViewComponent } from './vpvisit';
import { vpVisitCreateComponent } from './vpvisit';

@NgModule({
    imports: [
        BrowserModule,
        //BrowserAnimationsModule,
        ReactiveFormsModule,
        FormsModule,
        //MatDatepickerModule, MatInputModule,MatNativeDateModule,
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
        vpMapLeafletComponent,

        LeafletComponent,
        LeafletViewComponent,
        LeafletEditComponent,

        vpVisitListComponent,
        vpVisitViewComponent,
        vpVisitCreateComponent,
    ],
    providers: [
        { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },

        // provider used to create fake backend
        //fakeBackendProvider
    ],
    bootstrap: [AppComponent]
})

export class AppModule { }
