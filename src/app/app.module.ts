import { NgModule } from '@angular/core';
//import { FormsModule } from '@angular/forms'; // <-- NgModel lives here
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

// used to create fake backend
import { fakeBackendProvider } from './_helpers';

import { AppComponent }  from './app.component';
import { routing }        from './app.routing';
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
import { vpMapUpdateComponent } from './vpmapped';
import { vpMapLeafletComponent } from './vpmapped';

@NgModule({
    imports: [
        BrowserModule,
        //FormsModule,
        ReactiveFormsModule,
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
        vpMapUpdateComponent,
        vpMapLeafletComponent
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
