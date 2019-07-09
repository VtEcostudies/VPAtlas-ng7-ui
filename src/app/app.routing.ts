import { Routes, RouterModule } from '@angular/router';
//@add_component_here
import { HomeComponent } from './home';
import { LoginComponent } from './login';
import { RegisterComponent } from './register';
import { AdminComponent } from './admin';
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

import { vpListComponent } from './vppools';
import { vpViewComponent } from './vppools';

//@add_component_here
const appRoutes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'admin', component: AdminComponent, canActivate: [AuthGuard] },

    { path: 'pools/mapped/list', component: vpMapListComponent },
    { path: 'pools/mapped/view/:mappedPoolId', component: vpMapViewComponent },
    { path: 'pools/mapped/create', component: vpMapCreateComponent, canActivate: [AuthGuard] },
    { path: 'pools/mapped/update/:mappedPoolId', component: vpMapCreateComponent, canActivate: [AuthGuard] },

    { path: 'pools/visit/list', component: vpVisitListComponent },
    { path: 'pools/visit/view/:visitId', component: vpVisitViewComponent },
    { path: 'pools/visit/create', component: vpVisitCreateComponent, canActivate: [AuthGuard] },
    { path: 'pools/visit/create/:poolId', component: vpVisitCreateComponent, canActivate: [AuthGuard] },
    { path: 'pools/visit/update/:visitId', component: vpVisitCreateComponent, canActivate: [AuthGuard] },

    //new UI/UX combining 'Mapped Pools' and 'Pool Visits'
    { path: 'pools/list', component: vpListComponent },
    { path: 'pools/view/:poolId', component: vpViewComponent },

    // otherwise redirect to home
    { path: '**', redirectTo: '' } //comment this to debug
];

export const routing = RouterModule.forRoot(appRoutes);
