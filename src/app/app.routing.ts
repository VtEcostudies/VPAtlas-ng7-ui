import { Routes, RouterModule } from '@angular/router';
//@add_component_here
import { HomeComponent } from './home';
import { LoginComponent } from './login';
import { RegisterComponent } from './register';
import { ResetComponent } from './reset_confirm';
import { ConfirmComponent } from './reset_confirm';
import { AdminComponent } from './admin';
import { ProfileComponent } from './profile';
import { AuthGuard } from './_guards';

import { LeafletComponent } from './_components';

//import { vpMapLeafletComponent } from './vpmapped';
import { vpMapListComponent } from './vpmapped';
import { vpMapViewComponent } from './vpmapped';
import { vpMapCreateComponent } from './vpmapped';
//import { vpMapUpdateComponent } from './vpmapped';

import { vpVisitListComponent } from './vpvisit';
import { vpVisitViewComponent } from './vpvisit';
import { vpVisitCreateComponent } from './vpvisit';

import { vpReviewListComponent } from './vpreview';
import { vpReviewViewComponent } from './vpreview';
import { vpReviewCreateComponent } from './vpreview';

import { vpSurveyListComponent } from './vpsurvey';
import { vpSurveyUploadComponent } from './vpsurvey';

import { vpListComponent } from './vppools';
import { vpViewComponent } from './vppools';

//@add_component_here
const appRoutes: Routes = [
    { path: '', component: HomeComponent },
    //{ path: '', component: vpListComponent },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'reset', component: ResetComponent },
    { path: 'confirm/registration', component: LoginComponent },
    { path: 'confirm/email', component: LoginComponent },
    { path: 'confirm/reset', component: ConfirmComponent },
    { path: 'admin', component: AdminComponent, canActivate: [AuthGuard] },
    { path: 'user/profile/view/:userId', component: ProfileComponent },
    { path: 'user/profile/update/:userId', component: ProfileComponent },
    { path: 'user/profile/create', component: ProfileComponent },

    { path: 'pools/mapped/list', component: vpMapListComponent },
    { path: 'pools/mapped/view/:mappedPoolId', component: vpMapViewComponent },
    { path: 'pools/mapped/create', component: vpMapCreateComponent, canActivate: [AuthGuard] },
    { path: 'pools/mapped/update/:mappedPoolId', component: vpMapCreateComponent, canActivate: [AuthGuard] },

    { path: 'pools/visit/list', component: vpVisitListComponent },
    //{ path: 'pools/visit/view/:visitId', component: vpVisitViewComponent },
    { path: 'pools/visit/view/:visitId', component: vpViewComponent }, //with new mapped/visit UX, push all views to generic page
    { path: 'pools/visit/create', component: vpVisitCreateComponent, canActivate: [AuthGuard] },
    { path: 'pools/visit/create/:poolId', component: vpVisitCreateComponent, canActivate: [AuthGuard] },
    { path: 'pools/visit/update/:visitId', component: vpVisitCreateComponent, canActivate: [AuthGuard] },

    //new UI/UX combining 'Mapped Pools' and 'Pool Visits'
    { path: 'pools/list', component: vpListComponent },
    { path: 'pools/view/:poolId', component: vpViewComponent },

    { path: 'review/list', component: vpReviewListComponent, canActivate: [AuthGuard] },
    { path: 'review/list/:visitId', component: vpReviewListComponent, canActivate: [AuthGuard] },
    { path: 'review/view/:reviewId', component: vpReviewViewComponent, canActivate: [AuthGuard] },
    //{ path: 'review/create', component: vpReviewCreateComponent, canActivate: [AuthGuard] },
    { path: 'review/create/:visitId', component: vpReviewCreateComponent, canActivate: [AuthGuard] },
    { path: 'review/update/:reviewId', component: vpReviewCreateComponent, canActivate: [AuthGuard] },

    { path: 'survey/list', component: vpSurveyListComponent },
    { path: 'survey/upload', component: vpSurveyUploadComponent, canActivate: [AuthGuard] },

    // otherwise redirect to home
    { path: '**', redirectTo: '' } //comment this to debug
];

export const routing = RouterModule.forRoot(appRoutes);
