import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
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
import { ResetComponent } from './reset_confirm';
import { ConfirmComponent } from './reset_confirm';
import { UserComponent } from './admin';
import { ProfileComponent } from './profile';

import { LeafletComponent } from './_components';
import { LeafletPopupComponent } from './_components';

import { vpMapListComponent } from './vpmapped';
import { vpMapViewComponent } from './vpmapped';
import { vpMapCreateComponent } from './vpmapped';

import { vpVisitListComponent } from './vpvisit';
import { vpVisitCreateComponent } from './vpvisit';
import { vpVisitUploadComponent } from './vpvisit';

import { vpReviewListComponent } from './vpreview';
import { vpReviewViewComponent } from './vpreview';
import { vpReviewCreateComponent } from './vpreview';

import { vpSurveyUploadComponent } from './vpsurvey';
import { vpSurveyListComponent } from './vpsurvey';
import { vpSurveyViewComponent } from './vpsurvey';

import { vpListComponent } from './vppools';
import { vpViewComponent } from './vppools';

import { ModalModule } from './_modal';

import { UxValuesService } from './_global';

@NgModule({
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        ReactiveFormsModule,
        FormsModule,
        HttpClientModule,
        routing,
        ModalModule
    ],
    //@add_component_here
    declarations: [
        AppComponent,
        AlertComponent,
        HomeComponent,
        LoginComponent,
        RegisterComponent,
        ResetComponent,
        ConfirmComponent,
        UserComponent,
        ProfileComponent,
        LeafletComponent,
        LeafletPopupComponent,

        vpMapListComponent,
        vpMapViewComponent,
        vpMapCreateComponent,

        vpVisitListComponent,
        //vpVisitViewComponent,
        vpVisitCreateComponent,
        vpVisitUploadComponent,

        vpReviewListComponent,
        vpReviewViewComponent,
        vpReviewCreateComponent,

        vpSurveyUploadComponent,
        vpSurveyListComponent,
        vpSurveyViewComponent,

        vpListComponent,
        vpViewComponent,
    ],
    providers: [
        { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
        UxValuesService
        //fakeBackendProvider // provider used to create fake backend
    ],
    bootstrap: [AppComponent],
    entryComponents: [
      LeafletPopupComponent
    ]
})

export class AppModule { }
