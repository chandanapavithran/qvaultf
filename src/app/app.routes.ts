import { Routes } from '@angular/router';
import { Login } from './auth/login/login';
import { Signup } from './auth/signup/signup';
import { ForgotPassword } from './auth/forgot-password/forgot-password';
import { Otp } from './auth/otp/otp';
import { ResetPassword } from './auth/reset-password/reset-password';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: Login },
    { path: 'signup', component: Signup },
    { path: 'forgot-password', component: ForgotPassword },
    { path: 'otp', component: Otp },
    { path: 'reset-password', component: ResetPassword },
    { path: 'landing', loadComponent: () => import('./landing/landing').then(m => m.LandingComponent) },
    { path: 'search', loadComponent: () => import('./search/search.component').then(m => m.SearchComponent) },
    { path: 'favorites', loadComponent: () => import('./favorites/favorites.component').then(m => m.FavoritesComponent) },
    { path: 'request-paper', loadComponent: () => import('./request-paper/request-paper.component').then(m => m.RequestPaperComponent) },
];
