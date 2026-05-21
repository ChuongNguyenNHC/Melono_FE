import { Routes, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';

const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (authService.currentUserValue) {
    return true;
  }
  router.navigate(['/login']);
  return false;
};

const guestGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (!authService.currentUserValue) {
    return true;
  }
  const user = authService.currentUserValue;
  router.navigate([user.role === 'ADMIN' ? '/admin' : '/']);
  return false;
};

export const routes: Routes = [
  {
    path: 'forget',
    title: 'Quên mật khẩu | Melono',
    loadComponent: () => import('./auth/forget/forget').then(m => m.Forget),
    canActivate: [guestGuard],
    data: { layout: 'minimal' },
  },
  {
    path: 'login',
    title: 'Đăng nhập | Melono',
    loadComponent: () => import('./auth/login/login').then(m => m.Login),
    canActivate: [guestGuard],
    data: { layout: 'minimal' },
  },
  {
    path: 'profile',
    title: 'Hồ sơ cá nhân | Melono',
    loadComponent: () => import('./auth/profile/profile').then(m => m.Profile),
    canActivate: [authGuard],
  },
  {
    path: 'auth/login',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: '',
    title: 'Trang chủ | Melono',
    loadComponent: () => import('./landing/landing').then(m => m.Landing),
    canActivate: [authGuard],
    pathMatch: 'full',
  },
  {
    path: 'playlist/:id',
    title: 'Playlist | Melono',
    loadComponent: () => import('./playlistdetail/playlistdetail').then(m => m.PlaylistDetail),
    canActivate: [authGuard],
  },
  {
    path: 'song/:id',
    title: 'Chi tiết bài hát | Melono',
    loadComponent: () => import('./songdetail/songdetail').then(m => m.SongDetail),
    canActivate: [authGuard],
  },
  {
    path: 'search',
    title: 'Tìm kiếm | Melono',
    loadComponent: () => import('./search/search').then(m => m.Search),
    canActivate: [authGuard],
  },
  {
    path: 'genre',
    title: 'Thể loại | Melono',
    loadComponent: () => import('./genre/genre').then(m => m.Genre),
    canActivate: [authGuard],
  },
  {
    path: 'library',
    title: 'Thư viện | Melono',
    loadComponent: () => import('./library/library').then(m => m.Library),
    canActivate: [authGuard],
  },
  {
    path: 'artist-request',
    title: 'Đăng ký nghệ sĩ | Melono',
    loadComponent: () => import('./artist-request/artist-request').then(m => m.ArtistRequestPage),
    canActivate: [authGuard],
  },
  {
    path: 'admin',
    title: 'Admin | Melono',
    loadComponent: () => import('./admin/admin').then(m => m.Admin),
    canActivate: [authGuard],
    data: { layout: 'admin' },
  },
  {
    path: 'artist',
    title: 'Nghệ sĩ | Melono',
    loadComponent: () => import('./artist/artist').then(m => m.Artist),
    canActivate: [authGuard],
  },
];
