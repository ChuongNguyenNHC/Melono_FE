import { CommonModule } from '@angular/common';
import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

import { MusicSong } from '../models/music-domain.models';
import { MusicLibraryService } from '../services/music-library.service';
import { Footer } from '../footer/footer';
import { AdminArtists } from './admin-artists/admin-artists';
import { AdminDrawer } from './admin-drawer/admin-drawer';
import { AdminGenres } from './admin-genres/admin-genres';
import { AdminModal } from './admin-modal/admin-modal';
import { AdminSongs } from './admin-songs/admin-songs';
import { AdminUsers } from './admin-users/admin-users';
import {
  AdminTab,
  ArtistRequest,
  DrawerType,
  ModalType,
  RequestStatus,
  SongItem,
  SongStatus,
  UserRecord,
  UserRole,
  UserStatus,
} from './admin.models';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, AdminSongs, AdminUsers, AdminArtists, AdminGenres, AdminDrawer, AdminModal, Footer],
  templateUrl: './admin.html',
  host: {
    class: 'block h-full w-full'
  }
})
export class Admin {
  private readonly musicLibraryService = inject(MusicLibraryService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly http = inject(HttpClient);

  activeTab: AdminTab = 'songs';
  genres$ = this.musicLibraryService.genres$;

  songSearch = '';
  songStatusFilter: SongStatus | 'ALL' = 'ALL';

  userSearch = '';
  userRoleFilter: UserRole | 'ALL' = 'ALL';
  userStatusFilter: UserStatus | 'ALL' = 'ALL';

  artistSearch = '';
  artistStatusFilter: RequestStatus | 'ALL' = 'ALL';

  drawerType: DrawerType = null;
  isDrawerOpen = false;

  modalType: ModalType = null;
  isModalOpen = false;

  selectedSong: SongItem | null = null;
  selectedUser: UserRecord | null = null;
  selectedArtistRequest: ArtistRequest | null = null;

  rejectSongReason = '';
  banReason = '';
  rejectArtistReason = '';

  songs: SongItem[] = [];
  users: UserRecord[] = [];
  userPage = 0;
  userPageSize = 10;
  userTotalElements = 0;
  userTotalPages = 0;
  artistRequests: ArtistRequest[] = [];

  constructor() {
    this.musicLibraryService.songs$.subscribe(songs => {
      this.songs = songs
        .filter(song => song.source === 'LOCAL')
        .map(song => this.toSongItem(song));
      this.cdr.detectChanges();
    });
    this.loadUsers();
    this.loadArtistRequests();
  }

  readonly tabItems = [
    { key: 'songs', label: 'Ki\u1ec3m duy\u1ec7t b\u00e0i h\u00e1t', icon: 'bx bx-music' },
    { key: 'users', label: 'Qu\u1ea3n l\u00fd ng\u01b0\u1eddi d\u00f9ng', icon: 'bx bx-user' },
    { key: 'artists', label: 'Duy\u1ec7t y\u00eau c\u1ea7u ngh\u1ec7 s\u0129', icon: 'bx bx-microphone' },
    { key: 'genres', label: 'Qu\u1ea3n l\u00fd th\u1ec3 lo\u1ea1i', icon: 'bx bx-category' },
  ] as const;

  setActiveTab(tab: AdminTab): void {
    this.activeTab = tab;
    this.closeDrawer();
    this.closeModal();
    if (tab === 'users') {
      this.loadUsers();
    }
    if (tab === 'artists') {
      this.loadArtistRequests();
    }
  }

  get filteredSongs(): SongItem[] {
    const keyword = this.songSearch.trim().toLowerCase();

    return this.songs.filter(song => {
      const matchedKeyword =
        !keyword ||
        [song.title, song.artist, song.album, song.id].join(' ').toLowerCase().includes(keyword);

      const matchedStatus =
        this.songStatusFilter === 'ALL' || song.status === this.songStatusFilter;

      return matchedKeyword && matchedStatus;
    });
  }

  get filteredUsers(): UserRecord[] {
    return this.users;
  }

  get filteredArtistRequests(): ArtistRequest[] {
    const keyword = this.artistSearch.trim().toLowerCase();

    return this.artistRequests.filter(request => {
      const matchedKeyword =
        !keyword ||
        [request.userName, request.stageName, request.email, request.genre, request.id]
          .join(' ')
          .toLowerCase()
          .includes(keyword);

      const matchedStatus =
        this.artistStatusFilter === 'ALL' || request.status === this.artistStatusFilter;

      return matchedKeyword && matchedStatus;
    });
  }

  refreshSongs(): void {
    this.songSearch = '';
    this.songStatusFilter = 'ALL';
  }

  refreshUsers(): void {
    this.userSearch = '';
    this.userRoleFilter = 'ALL';
    this.userStatusFilter = 'ALL';
    this.userPage = 0;
    this.loadUsers();
  }

  refreshArtists(): void {
    this.artistSearch = '';
    this.artistStatusFilter = 'ALL';
    this.loadArtistRequests();
  }

  createGenre(name: string): void {
    this.musicLibraryService.createGenre(name);
  }

  approveGenre(genreId: string): void {
    this.musicLibraryService.approveArtistCreatedGenre(genreId);
  }

  deleteGenre(genreId: string): void {
    this.musicLibraryService.deleteArtistCreatedGenre(genreId);
  }

  openSongDrawer(song: SongItem): void {
    this.selectedSong = song;
    this.drawerType = 'song';
    this.isDrawerOpen = true;
    this.cdr.detectChanges();
  }

  openUserDrawer(user: UserRecord): void {
    this.selectedUser = user;
    this.drawerType = 'user';
    this.isDrawerOpen = true;
    this.cdr.detectChanges();
  }

  openArtistDrawer(request: ArtistRequest): void {
    this.selectedArtistRequest = request;
    this.drawerType = 'artist';
    this.isDrawerOpen = true;
    this.cdr.detectChanges();
  }

  closeDrawer(): void {
    this.drawerType = null;
    this.isDrawerOpen = false;
    this.cdr.detectChanges();
  }

  openApproveSongModal(song: SongItem): void {
    this.selectedSong = song;
    this.modalType = 'approveSong';
    this.isModalOpen = true;
    this.cdr.detectChanges();
  }

  openRejectSongModal(song: SongItem): void {
    this.selectedSong = song;
    this.rejectSongReason = '';
    this.modalType = 'rejectSong';
    this.isModalOpen = true;
    this.cdr.detectChanges();
  }

  openHideSongModal(song: SongItem): void {
    this.selectedSong = song;
    this.modalType = 'hideSong';
    this.isModalOpen = true;
    this.cdr.detectChanges();
  }

  openBanUserModal(user: UserRecord): void {
    this.selectedUser = user;
    this.banReason = '';
    this.modalType = 'banUser';
    this.isModalOpen = true;
    this.cdr.detectChanges();
  }

  openUnbanUserModal(user: UserRecord): void {
    this.selectedUser = user;
    this.modalType = 'unbanUser';
    this.isModalOpen = true;
    this.cdr.detectChanges();
  }

  openApproveArtistModal(request: ArtistRequest): void {
    this.selectedArtistRequest = request;
    this.modalType = 'approveArtist';
    this.isModalOpen = true;
    this.cdr.detectChanges();
  }

  openRejectArtistModal(request: ArtistRequest): void {
    this.selectedArtistRequest = request;
    this.rejectArtistReason = '';
    this.modalType = 'rejectArtist';
    this.isModalOpen = true;
    this.cdr.detectChanges();
  }

  closeModal(): void {
    this.modalType = null;
    this.isModalOpen = false;
    this.rejectSongReason = '';
    this.banReason = '';
    this.rejectArtistReason = '';
    this.cdr.detectChanges();
  }

  confirmApproveSong(): void {
    if (!this.selectedSong) return;
    const songTitle = this.selectedSong.title;
    this.musicLibraryService.approveSong(this.selectedSong.id).subscribe({
      next: () => {
        this.syncSongs();
        this.closeModal();
        this.closeDrawer();
        Swal.fire({
          title: 'Đã duyệt!',
          text: `Bài hát "${songTitle}" đã được duyệt thành công.`,
          icon: 'success',
          background: '#1c1c28',
          color: '#ffffff',
          confirmButtonColor: '#1ed760',
          timer: 2500,
          timerProgressBar: true
        });
      },
      error: () => {
        Swal.fire({
          title: 'Lỗi!',
          text: 'Không thể duyệt bài hát. Vui lòng thử lại.',
          icon: 'error',
          background: '#1c1c28',
          color: '#ffffff',
          confirmButtonColor: '#1ed760'
        });
      }
    });
  }

  confirmRejectSong(): void {
    if (!this.selectedSong) return;
    const songTitle = this.selectedSong.title;
    this.musicLibraryService.rejectSong(this.selectedSong.id, this.rejectSongReason).subscribe({
      next: () => {
        this.syncSongs();
        this.closeModal();
        this.closeDrawer();
        Swal.fire({
          title: 'Đã từ chối!',
          text: `Bài hát "${songTitle}" đã bị từ chối.`,
          icon: 'info',
          background: '#1c1c28',
          color: '#ffffff',
          confirmButtonColor: '#1ed760',
          timer: 2500,
          timerProgressBar: true
        });
      },
      error: () => {
        Swal.fire({
          title: 'Lỗi!',
          text: 'Không thể từ chối bài hát. Vui lòng thử lại.',
          icon: 'error',
          background: '#1c1c28',
          color: '#ffffff',
          confirmButtonColor: '#1ed760'
        });
      }
    });
  }

  confirmHideSong(): void {
    if (!this.selectedSong) return;
    const songTitle = this.selectedSong.title;
    this.musicLibraryService.hideSong(this.selectedSong.id).subscribe({
      next: () => {
        this.syncSongs();
        this.closeModal();
        this.closeDrawer();
        Swal.fire({
          title: 'Đã ẩn!',
          text: `Bài hát "${songTitle}" đã được ẩn khỏi danh sách công khai.`,
          icon: 'success',
          background: '#1c1c28',
          color: '#ffffff',
          confirmButtonColor: '#1ed760',
          timer: 2500,
          timerProgressBar: true
        });
      },
      error: () => {
        Swal.fire({
          title: 'Lỗi!',
          text: 'Không thể ẩn bài hát. Vui lòng thử lại.',
          icon: 'error',
          background: '#1c1c28',
          color: '#ffffff',
          confirmButtonColor: '#1ed760'
        });
      }
    });
  }

  restoreSong(song: SongItem): void {
    this.musicLibraryService.restoreSong(song.id).subscribe({
      next: () => {
        this.syncSongs();
        Swal.fire({
          title: 'Đã bỏ ẩn!',
          text: `Bài hát "${song.title}" đã được hiển thị trở lại.`,
          icon: 'success',
          background: '#1c1c28',
          color: '#ffffff',
          confirmButtonColor: '#1ed760',
          timer: 2500,
          timerProgressBar: true
        });
      },
      error: () => {
        Swal.fire({
          title: 'Lỗi!',
          text: 'Không thể bỏ ẩn bài hát. Vui lòng thử lại.',
          icon: 'error',
          background: '#1c1c28',
          color: '#ffffff',
          confirmButtonColor: '#1ed760'
        });
      }
    });
  }

  confirmBanUser(): void {
    if (!this.selectedUser || this.selectedUser.role === 'ADMIN') return;
    const userEmail = this.selectedUser.email;
    this.musicLibraryService.banUserApi(this.selectedUser.id, this.banReason).subscribe({
      next: () => {
        this.loadUsers();
        this.closeModal();
        Swal.fire({
          title: 'Đã khóa tài khoản!',
          text: `Tài khoản của "${userEmail}" đã bị khóa thành công.`,
          icon: 'warning',
          background: '#1c1c28',
          color: '#ffffff',
          confirmButtonColor: '#1ed760',
          timer: 2500,
          timerProgressBar: true
        });
      },
      error: (err) => {
        console.error('Failed to ban user', err);
        Swal.fire({
          title: 'Lỗi!',
          text: 'Không thể khóa tài khoản. Vui lòng thử lại.',
          icon: 'error',
          background: '#1c1c28',
          color: '#ffffff',
          confirmButtonColor: '#1ed760'
        });
      }
    });
  }

  confirmUnbanUser(): void {
    if (!this.selectedUser || this.selectedUser.role === 'ADMIN') return;
    const userEmail = this.selectedUser.email;
    this.musicLibraryService.unbanUserApi(this.selectedUser.id).subscribe({
      next: () => {
        this.loadUsers();
        this.closeModal();
        Swal.fire({
          title: 'Đã mở khóa!',
          text: `Tài khoản của "${userEmail}" đã hoạt động trở lại.`,
          icon: 'success',
          background: '#1c1c28',
          color: '#ffffff',
          confirmButtonColor: '#1ed760',
          timer: 2500,
          timerProgressBar: true
        });
      },
      error: (err) => {
        console.error('Failed to unban user', err);
        Swal.fire({
          title: 'Lỗi!',
          text: 'Không thể mở khóa tài khoản. Vui lòng thử lại.',
          icon: 'error',
          background: '#1c1c28',
          color: '#ffffff',
          confirmButtonColor: '#1ed760'
        });
      }
    });
  }

  onUserSearchChange(val: string): void {
    this.userSearch = val;
    this.userPage = 0;
    this.loadUsers();
  }

  onUserRoleChange(val: UserRole | 'ALL'): void {
    this.userRoleFilter = val;
    this.userPage = 0;
    this.loadUsers();
  }

  onUserStatusChange(val: UserStatus | 'ALL'): void {
    this.userStatusFilter = val;
    this.userPage = 0;
    this.loadUsers();
  }

  onUserPageChange(page: number): void {
    this.userPage = page;
    this.loadUsers();
  }

  loadUsers(): void {
    this.musicLibraryService.getUsersPage(
      this.userSearch,
      this.userRoleFilter,
      this.userStatusFilter,
      this.userPage,
      this.userPageSize
    ).subscribe({
      next: (res) => {
        if (res && res.content) {
          this.users = res.content.map((user: any) => this.toUserRecord(user));
          this.userTotalElements = res.totalElements || 0;
          this.userTotalPages = res.totalPages || 0;
        } else {
          this.users = [];
          this.userTotalElements = 0;
          this.userTotalPages = 0;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load users from backend API', err);
        this.users = [];
        this.userTotalElements = 0;
        this.userTotalPages = 0;
        this.cdr.detectChanges();
      }
    });
  }

  private toUserRecord(user: any): UserRecord {
    return {
      id: user.userId,
      name: user.stageName || user.username || 'Người dùng Melono',
      username: user.username || 'user',
      email: user.email,
      avatar: user.avatarUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.username || 'User') + '&background=random',
      role: user.role as UserRole,
      status: user.status === 'BANNED' ? 'Banned' : 'Active',
      createdAt: this.formatDate(user.createdAt),
      playlistCount: 0,
      likedSongsCount: 0,
      banReason: user.banReason || undefined
    };
  }

  confirmApproveArtist(): void {
    if (!this.selectedArtistRequest) return;
    const requestId = this.selectedArtistRequest.id;
    const stageName = this.selectedArtistRequest.stageName;

    this.http.put<any>(`http://localhost:8080/api/artist-requests/${requestId}/status?status=APPROVED`, {}).subscribe({
      next: () => {
        this.loadArtistRequests();
        this.loadUsers();
        this.closeModal();
        this.closeDrawer();
        Swal.fire({
          title: 'Đã cấp quyền nghệ sĩ!',
          text: `Nghệ sĩ "${stageName}" đã được duyệt thành công.`,
          icon: 'success',
          background: '#1c1c28',
          color: '#ffffff',
          confirmButtonColor: '#1ed760',
          timer: 2500,
          timerProgressBar: true,
        });
      },
      error: (err) => {
        const msg = err.error?.message || err.error || 'Không thể duyệt yêu cầu. Vui lòng thử lại.';
        Swal.fire({
          title: 'Lỗi!',
          text: msg,
          icon: 'error',
          background: '#1c1c28',
          color: '#ffffff',
          confirmButtonColor: '#1ed760',
        });
      }
    });
  }

  confirmRejectArtist(): void {
    if (!this.selectedArtistRequest) return;
    const requestId = this.selectedArtistRequest.id;
    const stageName = this.selectedArtistRequest.stageName;

    this.http.put<any>(`http://localhost:8080/api/artist-requests/${requestId}/status?status=REJECTED`, {}).subscribe({
      next: () => {
        this.loadArtistRequests();
        this.closeModal();
        this.closeDrawer();
        Swal.fire({
          title: 'Đã từ chối!',
          text: `Yêu cầu của nghệ sĩ "${stageName}" đã bị từ chối.`,
          icon: 'info',
          background: '#1c1c28',
          color: '#ffffff',
          confirmButtonColor: '#1ed760',
          timer: 2500,
          timerProgressBar: true,
        });
      },
      error: () => {
        Swal.fire({
          title: 'Lỗi!',
          text: 'Không thể từ chối yêu cầu. Vui lòng thử lại.',
          icon: 'error',
          background: '#1c1c28',
          color: '#ffffff',
          confirmButtonColor: '#1ed760',
        });
      }
    });
  }

  trackById(_index: number, item: { id: string }): string {
    return item.id;
  }

  loadArtistRequests(): void {
    this.http.get<any[]>('http://localhost:8080/api/artist-requests').subscribe({
      next: (data) => {
        this.artistRequests = data.map(req => this.toArtistRequest(req));
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load artist requests from API', err);
        this.artistRequests = [];
        this.cdr.detectChanges();
      }
    });
  }

  private toArtistRequest(req: any): ArtistRequest {
    const statusMap: Record<string, RequestStatus> = {
      'PENDING': 'Pending',
      'APPROVED': 'Approved',
      'REJECTED': 'Rejected',
    };
    return {
      id: req.requestId,
      userId: req.userId,
      userName: req.userName || 'Người dùng',
      email: req.email || '',
      avatar: req.avatarUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(req.userName || 'User') + '&background=random',
      stageName: req.stageName,
      genre: req.genre || '',
      bio: req.bio || '',
      createdAt: this.formatDate(req.createdAt),
      status: statusMap[req.status?.toUpperCase()] || 'Pending',
    };
  }

  private syncSongs(): void {
    this.songs = this.musicLibraryService.snapshot.songs
      .filter(song => song.source === 'LOCAL')
      .map(song => this.toSongItem(song));
    this.cdr.detectChanges();
  }

  private toSongItem(song: MusicSong): SongItem {
    return {
      id: song.id,
      title: song.title,
      album: song.description || 'Melono',
      artist: song.artistName,
      thumbnail: song.thumbnailUrl,
      source: song.source,
      duration: song.duration,
      createdAt: this.formatDate(song.createdAt),
      status: this.toAdminSongStatus(song.status),
      audioUrl: song.fileUrl || song.previewUrl || '',
      rejectReason: song.rejectReason,
    };
  }

  private toAdminSongStatus(status: MusicSong['status']): SongStatus {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'APPROVED':
        return 'Approved';
      case 'REJECTED':
        return 'Rejected';
      case 'HIDDEN':
        return 'Hidden';
      default:
        return 'Pending';
    }
  }

  private formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }
}
