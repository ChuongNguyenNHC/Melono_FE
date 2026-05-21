import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
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
import { ADMIN_ARTIST_REQUESTS, ADMIN_USERS } from './admin.mock-data';
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
  users: UserRecord[] = ADMIN_USERS.map(user => ({ ...user }));
  artistRequests: ArtistRequest[] = ADMIN_ARTIST_REQUESTS.map(request => ({ ...request }));

  constructor() {
    this.musicLibraryService.songs$.subscribe(songs => {
      this.songs = songs
        .filter(song => song.source === 'LOCAL')
        .map(song => this.toSongItem(song));
    });
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
    const keyword = this.userSearch.trim().toLowerCase();

    return this.users.filter(user => {
      const matchedKeyword =
        !keyword ||
        [user.name, user.username, user.email, user.id].join(' ').toLowerCase().includes(keyword);

      const matchedRole =
        this.userRoleFilter === 'ALL' || user.role === this.userRoleFilter;

      const matchedStatus =
        this.userStatusFilter === 'ALL' || user.status === this.userStatusFilter;

      return matchedKeyword && matchedRole && matchedStatus;
    });
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
  }

  refreshArtists(): void {
    this.artistSearch = '';
    this.artistStatusFilter = 'ALL';
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
  }

  openUserDrawer(user: UserRecord): void {
    this.selectedUser = user;
    this.drawerType = 'user';
    this.isDrawerOpen = true;
  }

  openArtistDrawer(request: ArtistRequest): void {
    this.selectedArtistRequest = request;
    this.drawerType = 'artist';
    this.isDrawerOpen = true;
  }

  closeDrawer(): void {
    this.drawerType = null;
    this.isDrawerOpen = false;
  }

  openApproveSongModal(song: SongItem): void {
    this.selectedSong = song;
    this.modalType = 'approveSong';
    this.isModalOpen = true;
  }

  openRejectSongModal(song: SongItem): void {
    this.selectedSong = song;
    this.rejectSongReason = '';
    this.modalType = 'rejectSong';
    this.isModalOpen = true;
  }

  openHideSongModal(song: SongItem): void {
    this.selectedSong = song;
    this.modalType = 'hideSong';
    this.isModalOpen = true;
  }

  openBanUserModal(user: UserRecord): void {
    this.selectedUser = user;
    this.banReason = '';
    this.modalType = 'banUser';
    this.isModalOpen = true;
  }

  openUnbanUserModal(user: UserRecord): void {
    this.selectedUser = user;
    this.modalType = 'unbanUser';
    this.isModalOpen = true;
  }

  openApproveArtistModal(request: ArtistRequest): void {
    this.selectedArtistRequest = request;
    this.modalType = 'approveArtist';
    this.isModalOpen = true;
  }

  openRejectArtistModal(request: ArtistRequest): void {
    this.selectedArtistRequest = request;
    this.rejectArtistReason = '';
    this.modalType = 'rejectArtist';
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.modalType = null;
    this.isModalOpen = false;
    this.rejectSongReason = '';
    this.banReason = '';
    this.rejectArtistReason = '';
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
    this.selectedUser.status = 'Banned';
    this.selectedUser.banReason = this.banReason.trim();
    this.closeModal();
  }

  confirmUnbanUser(): void {
    if (!this.selectedUser || this.selectedUser.role === 'ADMIN') return;
    this.selectedUser.status = 'Active';
    this.selectedUser.banReason = '';
    this.closeModal();
  }

  confirmApproveArtist(): void {
    if (!this.selectedArtistRequest) return;

    this.selectedArtistRequest.status = 'Approved';

    const targetUser = this.users.find(
      user => user.id === this.selectedArtistRequest?.userId
    );

    if (targetUser) {
      targetUser.role = 'ARTIST';
      if (targetUser.status === 'Banned') {
        targetUser.status = 'Active';
      }
    }

    this.closeModal();
  }

  confirmRejectArtist(): void {
    if (!this.selectedArtistRequest) return;
    this.selectedArtistRequest.status = 'Rejected';
    this.selectedArtistRequest.rejectReason = this.rejectArtistReason.trim();
    this.closeModal();
  }

  trackById(_index: number, item: { id: string }): string {
    return item.id;
  }

  private syncSongs(): void {
    this.songs = this.musicLibraryService.snapshot.songs
      .filter(song => song.source === 'LOCAL')
      .map(song => this.toSongItem(song));
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
