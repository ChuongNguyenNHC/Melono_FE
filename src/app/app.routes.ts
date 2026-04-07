import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'forget',
    title: 'Quên mật khẩu | Melono',
    loadComponent: () => import('./auth/forget/forget').then(m => m.Forget)
  },
  {
    path: 'login',
    title: 'Đăng nhập | Melono',
    loadComponent: () => import('./auth/login/login').then(m => m.Login)
  },
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  }
];
