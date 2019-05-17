import { Routes, RouterModule } from '@angular/router';
//@add_component_here
import { HomeComponent } from './home';
import { LoginComponent } from './login';
import { RegisterComponent } from './register';
import { AdminComponent } from './admin';
import { vpMapListComponent } from './vpmapped';
import { vpMapViewComponent } from './vpmapped';
import { vpMapCreateComponent } from './vpmapped';
import { vpMapUpdateComponent } from './vpmapped';
import { vpMapLeafletComponent } from './vpmapped';
import { AuthGuard } from './_guards';

//@add_component_here
const appRoutes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'admin', component: AdminComponent, canActivate: [AuthGuard] },
    { path: 'pools/mapped/list', component: vpMapListComponent },
    { path: 'pools/mapped/view/:mappedPoolId', component: vpMapViewComponent },
    { path: 'pools/mapped/create', component: vpMapCreateComponent, canActivate: [AuthGuard] },
    { path: 'pools/mapped/update/:mappedPoolId', component: vpMapUpdateComponent, canActivate: [AuthGuard] },
    { path: 'pools/mapped/leaflet', component: vpMapLeafletComponent },

    // otherwise redirect to home
    //{ path: '**', redirectTo: '' }
];

export const routing = RouterModule.forRoot(appRoutes);
