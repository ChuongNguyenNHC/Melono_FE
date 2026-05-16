import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MusicGenre, MusicSong, SongStatus as DomainSongStatus } from '../models/music-domain.models';
import { MusicLibraryService } from '../services/music-library.service';

type ArtistTab = 'tracking' | 'management';
type ArtistViewMode = 'list' | 'upload' | 'edit';
type SongStatus = 'Pending' | 'Approved' | 'Rejected' | 'Hidden';
type SongSource = 'LOCAL' | 'ITUNES';

type ArtistModalType = 'deleteSong' | null;
type ArtistDrawerType = 'song' | null;

interface ArtistSongItem {
  id: string;
  title: string;
  genre: string;
  uploadDate: string;
  status: SongStatus;
  note: string;
  thumbnail: string;
  source: SongSource;
  duration: string;
  description: string;
  audioUrl?: string;
  rejectReason?: string;
  likeCount: number;
  listenCount: number;
}

interface SongFormData {
  title: string;
  genre: string;
  stageName: string;
  description: string;
  duration: string;
  audioFileName: string;
  audioFileUrl: string;
  thumbnailUrl: string;
}

@Component({
  selector: 'app-artist',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './artist.html',
})
export class Artist {
  private readonly libraryService = inject(MusicLibraryService);

  activeTab: ArtistTab = 'tracking';
  managementMode: ArtistViewMode = 'list';

  stageName = this.resolveStageName();

  trackingSearch = '';
  trackingStatusFilter: SongStatus | 'ALL' = 'ALL';
  trackingSourceFilter: SongSource | 'ALL' = 'ALL';

  managementSearch = '';
  managementStatusFilter: SongStatus | 'ALL' = 'ALL';

  drawerType: ArtistDrawerType = null;
  isDrawerOpen = false;

  modalType: ArtistModalType = null;
  isModalOpen = false;

  selectedSong: ArtistSongItem | null = null;
  songPendingDelete: ArtistSongItem | null = null;

  readonly sidebarItems = [
    { key: 'tracking', label: 'Theo dõi nhạc', icon: 'bx bx-music' },
    { key: 'management', label: 'Quản lý nhạc', icon: 'bx bx-upload' },
  ] as const;

  songForm: SongFormData = this.createEmptyForm();
  editingSongId: string | null = null;

  get genreOptions(): string[] {
    return this.libraryService.snapshot.genres.map(genre => genre.name);
  }

  get songs(): ArtistSongItem[] {
    const genres = this.libraryService.snapshot.genres;

    return this.libraryService.snapshot.songs
      .filter(song => song.ownerUserId === this.libraryService.currentUserId)
      .map(song => this.toArtistSongItem(song, genres));
  }

  set songs(_value: ArtistSongItem[]) {
    // Kept for template compatibility; song data now lives in MusicLibraryService.
  }

  setActiveTab(tab: ArtistTab): void {
    this.activeTab = tab;
    this.closeDrawer();
    this.closeModal();

    if (tab === 'tracking') {
      this.managementMode = 'list';
    }

    if (tab === 'management' && this.managementMode !== 'upload' && this.managementMode !== 'edit') {
      this.managementMode = 'list';
    }
  }

  openUploadForm(): void {
    this.activeTab = 'management';
    this.managementMode = 'upload';
    this.editingSongId = null;
    this.songForm = this.createEmptyForm();
    this.closeDrawer();
    this.closeModal();
  }

  openEditForm(song: ArtistSongItem): void {
    this.activeTab = 'management';
    this.managementMode = 'edit';
    this.editingSongId = song.id;
    this.songForm = {
      title: song.title,
      genre: song.genre,
      stageName: this.stageName,
      description: song.description,
      duration: song.duration,
      audioFileName: song.title.toLowerCase().replace(/\s+/g, '-') + '.mp3',
      audioFileUrl: song.audioUrl || '',
      thumbnailUrl: song.thumbnail,
    };
    this.closeDrawer();
  }

  onAudioFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.songForm.audioFileName = file.name;

    const objectUrl = URL.createObjectURL(file);
    const audio = new Audio(objectUrl);

    audio.onloadedmetadata = () => {
      this.songForm.duration = this.formatDuration(audio.duration);
      URL.revokeObjectURL(objectUrl);
    };

    this.readFileAsDataUrl(file, value => {
      this.songForm.audioFileUrl = value;
    });
  }

  onThumbnailFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.readFileAsDataUrl(file, value => {
      this.songForm.thumbnailUrl = value;
    });
  }

  cancelSongForm(): void {
    this.managementMode = 'list';
    this.editingSongId = null;
    this.songForm = this.createEmptyForm();
  }

  submitSongForm(): void {
    const title = this.songForm.title.trim();
    const genre = this.songForm.genre.trim();
    const description = this.songForm.description.trim();

    if (!title || !genre || !description) return;

    const genreId = this.findGenreIdByName(genre);
    if (!genreId) return;

    const payload = {
      ownerUserId: this.libraryService.currentUserId,
      title,
      artistName: this.songForm.stageName.trim() || this.stageName,
      genreIds: [genreId],
      duration: this.songForm.duration.trim() || '--:--',
      description,
      thumbnailUrl:
        this.songForm.thumbnailUrl.trim() ||
        'https://via.placeholder.com/300x300?text=Melono',
      fileUrl: this.songForm.audioFileUrl || 'assets/audio/demo-song.mp3',
    };

    if (this.managementMode === 'upload') {
      this.libraryService.createLocalSong(payload);
      this.songForm = this.createEmptyForm();
      this.managementMode = 'list';
      return;
    }

    if (this.managementMode === 'edit' && this.editingSongId) {
      this.libraryService.updateArtistSong(
        this.editingSongId,
        this.libraryService.currentUserId,
        payload
      );
      this.songForm = this.createEmptyForm();
      this.editingSongId = null;
      this.managementMode = 'list';
    }
  }

  openSongDrawer(song: ArtistSongItem): void {
    this.selectedSong = song;
    this.drawerType = 'song';
    this.isDrawerOpen = true;
  }

  closeDrawer(): void {
    this.drawerType = null;
    this.isDrawerOpen = false;
  }

  openDeleteModal(song: ArtistSongItem): void {
    this.songPendingDelete = song;
    this.modalType = 'deleteSong';
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.modalType = null;
    this.isModalOpen = false;
    this.songPendingDelete = null;
  }

  confirmDeleteSong(): void {
    if (!this.songPendingDelete) return;

    this.libraryService.deleteArtistSong(this.songPendingDelete.id, this.libraryService.currentUserId);

    if (this.selectedSong?.id === this.songPendingDelete.id) {
      this.closeDrawer();
      this.selectedSong = null;
    }

    this.closeModal();
  }

  refreshTracking(): void {
    this.trackingSearch = '';
    this.trackingStatusFilter = 'ALL';
    this.trackingSourceFilter = 'ALL';
  }

  refreshManagement(): void {
    this.managementSearch = '';
    this.managementStatusFilter = 'ALL';
  }

  get trackingSongs(): ArtistSongItem[] {
    const keyword = this.trackingSearch.trim().toLowerCase();

    return this.songs.filter(song => {
      if (song.status !== 'Approved') return false;

      const matchedKeyword =
        !keyword ||
        [song.title, song.genre, song.id]
          .join(' ')
          .toLowerCase()
          .includes(keyword);

      const matchedSource =
        this.trackingSourceFilter === 'ALL' || song.source === this.trackingSourceFilter;

      return matchedKeyword && matchedSource;
    });
  }

  get managementSongs(): ArtistSongItem[] {
    const keyword = this.managementSearch.trim().toLowerCase();

    return this.songs.filter(song => {
      const matchedKeyword =
        !keyword ||
        [song.title, song.genre, song.id]
          .join(' ')
          .toLowerCase()
          .includes(keyword);

      const matchedStatus =
        this.managementStatusFilter === 'ALL' || song.status === this.managementStatusFilter;

      return matchedKeyword && matchedStatus;
    });
  }

  getSongStatusLabel(status: SongStatus): string {
    switch (status) {
      case 'Pending':
        return 'Chờ duyệt';
      case 'Approved':
        return 'Đã duyệt';
      case 'Rejected':
        return 'Từ chối';
      case 'Hidden':
        return 'Đã ẩn';
      default:
        return status;
    }
  }

  getSongStatusClass(status: SongStatus): string {
    switch (status) {
      case 'Pending':
        return 'text-amber-300';
      case 'Approved':
        return 'text-emerald-300';
      case 'Rejected':
        return 'text-rose-300';
      case 'Hidden':
        return 'text-slate-300';
      default:
        return 'text-white';
    }
  }

  getSongSourceLabel(source: SongSource): string {
    switch (source) {
      case 'LOCAL':
        return 'Địa phương';
      case 'ITUNES':
        return 'iTunes';
      default:
        return source;
    }
  }

  getTrackingNote(song: ArtistSongItem): string {
    if (song.status === 'Pending') return 'Đang chờ quản trị viên kiểm duyệt';
    if (song.status === 'Approved') return 'Bài hát đã được phát hành';
    if (song.status === 'Hidden') return 'Bài hát đang bị ẩn khỏi người dùng';

    return song.rejectReason || song.note;
  }

  trackById(_index: number, item: { id: string }): string {
    return item.id;
  }

  private createEmptyForm(): SongFormData {
    return {
      title: '',
      genre: '',
      stageName: this.stageName,
      description: '',
      duration: '',
      audioFileName: '',
      audioFileUrl: '',
      thumbnailUrl: '',
    };
  }

  private toArtistSongItem(song: MusicSong, genres: MusicGenre[]): ArtistSongItem {
    const genre = genres.find(item => item.id === song.genreIds[0])?.name || 'Chưa phân loại';

    return {
      id: song.id,
      title: song.title,
      genre,
      uploadDate: this.formatDate(song.createdAt),
      status: this.toArtistSongStatus(song.status),
      note: song.rejectReason || '',
      thumbnail: song.thumbnailUrl,
      source: 'LOCAL',
      duration: song.duration,
      description: song.description || '',
      audioUrl: song.fileUrl || song.previewUrl,
      rejectReason: song.rejectReason,
      likeCount: this.libraryService.snapshot.likedSongs.filter(item => item.songId === song.id).length,
      listenCount: this.libraryService.snapshot.listenHistory.filter(item => item.songId === song.id).length,
    };
  }

  private toArtistSongStatus(status: DomainSongStatus): SongStatus {
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

  private findGenreIdByName(name: string): string | undefined {
    return this.libraryService.snapshot.genres.find(
      genre => genre.name.toLowerCase() === name.toLowerCase()
    )?.id;
  }

  private resolveStageName(): string {
    const userId = this.libraryService.currentUserId;
    const approvedRequest = this.libraryService.snapshot.artistRequests.find(
      request => request.userId === userId && request.status === 'APPROVED'
    );
    const user = this.libraryService.snapshot.users.find(item => item.id === userId);

    return approvedRequest?.stageName || user?.name || 'Nghệ sĩ Melono';
  }

  private formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  private formatDuration(seconds: number): string {
    if (!Number.isFinite(seconds)) return '--:--';

    const totalSeconds = Math.max(0, Math.round(seconds));
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  }

  private readFileAsDataUrl(file: File, callback: (value: string) => void): void {
    const reader = new FileReader();

    reader.onload = () => callback(String(reader.result || ''));
    reader.readAsDataURL(file);
  }
}
