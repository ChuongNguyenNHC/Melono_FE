import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'forget',
    title: 'Quên mật khẩu | Melono',
    loadComponent: () => import('./auth/forget/forget').then(m => m.Forget),
  },
  {
    path: 'login',
    title: 'Đăng nhập | Melono',
    loadComponent: () => import('./auth/login/login').then(m => m.Login),
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
    pathMatch: 'full',
  },
  {
    path: 'playlist/:id',
    title: 'Playlist | Melono',
    loadComponent: () => import('./playlistdetail/playlistdetail').then(m => m.PlaylistDetail),
  },
  {
    path: 'search',
    title: 'Tìm kiếm | Melono',
    loadComponent: () => import('./search/search').then(m => m.Search),
  },
  {
    path: 'genre',
    title: 'Thể loại | Melono',
    loadComponent: () => import('./genre/genre').then(m => m.Genre),
  },
  {
    path: 'library',
    title: 'Thư viện | Melono',
    loadComponent: () => import('./library/library').then(m => m.Library),
  },
  {
    path: 'artist-request',
    title: 'Đăng ký nghệ sĩ | Melono',
    loadComponent: () => import('./artist-request/artist-request').then(m => m.ArtistRequestPage),
  },
  {
    path: 'admin',
    title: 'Admin | Melono',
    loadComponent: () => import('./admin/admin').then(m => m.Admin),
    data: { layout: 'minimal' },
  },
  {
    path: 'artist',
    title: 'Nghệ sĩ | Melono',
    loadComponent: () => import('./artist/artist').then(m => m.Artist),
    data: { layout: 'minimal' },
  },
];
