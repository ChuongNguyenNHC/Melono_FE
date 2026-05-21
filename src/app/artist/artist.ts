import { CommonModule } from '@angular/common';
import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';

import { MusicGenre, MusicSong, SongStatus as DomainSongStatus } from '../models/music-domain.models';
import { MusicLibraryService } from '../services/music-library.service';
import { ArtistDrawer } from './artist-drawer/artist-drawer';
import { ArtistManagement } from './artist-management/artist-management';
import { ArtistModal } from './artist-modal/artist-modal';
import {
  ArtistDrawerType,
  ArtistModalType,
  ArtistSongItem,
  ArtistViewMode,
  SongFormData,
  SongStatus,
} from './artist.models';
import { Footer } from '../footer/footer';

import { UploadService } from '../services/upload.service';
import { AuthService } from '../services/auth.service';
import Swal from 'sweetalert2';
import { forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-artist',
  standalone: true,
  imports: [CommonModule, ArtistManagement, ArtistDrawer, ArtistModal, Footer],
  templateUrl: './artist.html',
  host: {
    class: 'block h-full w-full'
  }
})
export class Artist {
  private readonly libraryService = inject(MusicLibraryService);
  private readonly uploadService = inject(UploadService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  selectedAudioFile: File | null = null;
  selectedThumbnailFile: File | null = null;

  managementMode: ArtistViewMode = 'list';

  stageName = this.resolveStageName();

  managementSearch = '';
  managementStatusFilter: SongStatus | 'ALL' = 'ALL';

  drawerType: ArtistDrawerType = null;
  isDrawerOpen = false;

  modalType: ArtistModalType = null;
  isModalOpen = false;

  selectedSong: ArtistSongItem | null = null;
  songPendingDelete: ArtistSongItem | null = null;

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

  openUploadForm(): void {
    this.stageName = this.resolveStageName();
    this.managementMode = 'upload';
    this.editingSongId = null;
    this.selectedAudioFile = null;
    this.selectedThumbnailFile = null;
    this.songForm = this.createEmptyForm();
    this.closeDrawer();
    this.closeModal();
  }

  openEditForm(song: ArtistSongItem): void {
    this.stageName = this.resolveStageName();
    this.managementMode = 'edit';
    this.editingSongId = song.id;
    this.selectedAudioFile = null;
    this.selectedThumbnailFile = null;
    this.songForm = {
      title: song.title,
      genres: song.genre.split(',').map(s => s.trim()).filter(Boolean),
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

    this.selectedAudioFile = file;
    this.songForm.audioFileName = file.name;

    const objectUrl = URL.createObjectURL(file);
    const audio = new Audio(objectUrl);

    audio.onloadedmetadata = () => {
      this.songForm.duration = this.formatDuration(audio.duration);
    };

    // Dùng objectUrl làm local preview nhẹ nhàng thay vì base64 DataURL
    this.songForm.audioFileUrl = objectUrl;

    // Reset input value to allow selecting the same file again if removed
    input.value = '';
  }

  onThumbnailFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.selectedThumbnailFile = file;
    
    // Tạo objectUrl làm preview hình ảnh
    this.songForm.thumbnailUrl = URL.createObjectURL(file);

    // Reset input value to allow selecting the same file again if removed
    input.value = '';
  }

  onAudioFileRemoved(): void {
    this.selectedAudioFile = null;
    this.songForm.audioFileName = '';
    this.songForm.audioFileUrl = '';
    this.songForm.duration = '';
  }

  onThumbnailFileRemoved(): void {
    this.selectedThumbnailFile = null;
    this.songForm.thumbnailUrl = '';
  }

  cancelSongForm(): void {
    this.managementMode = 'list';
    this.editingSongId = null;
    this.selectedAudioFile = null;
    this.selectedThumbnailFile = null;
    this.songForm = this.createEmptyForm();
  }

  submitSongForm(): void {
    const title = this.songForm.title.trim();
    const genres = this.songForm.genres || [];
    const description = this.songForm.description.trim();

    if (!title || genres.length === 0 || !description) {
      Swal.fire({
        title: 'Lỗi nhập liệu!',
        text: 'Vui lòng nhập đầy đủ tiêu đề, chọn ít nhất một thể loại và mô tả.',
        icon: 'error',
        background: '#1c1c28',
        color: '#ffffff',
        confirmButtonColor: '#1ed760'
      });
      return;
    }

    const genreIds = genres.map(name => this.findGenreIdByName(name)).filter(Boolean) as string[];
    if (genreIds.length === 0) return;

    // Nếu là đăng bài hát mới, bắt buộc phải chọn file nhạc và file ảnh đại diện
    if (this.managementMode === 'upload' && (!this.selectedAudioFile || !this.selectedThumbnailFile)) {
      Swal.fire({
        title: 'Thiếu tệp tin!',
        text: 'Vui lòng chọn đầy đủ cả tệp nhạc (.mp3) và ảnh đại diện (.jpg/.png).',
        icon: 'warning',
        background: '#1c1c28',
        color: '#ffffff',
        confirmButtonColor: '#1ed760'
      });
      return;
    }

    // Hiển thị trạng thái đang xử lý tải lên MinIO
    Swal.fire({
      title: 'Đang lưu bài hát...',
      html: `
        <div class="flex flex-col items-center justify-center p-4">
          <div class="animate-spin rounded-full h-10 w-10 border-2 border-emerald-500/20 border-t-emerald-400 mb-4"></div>
          <p class="text-sm text-slate-300 text-center">Hệ thống đang tải các tệp tin lên bộ lưu trữ MinIO và xử lý dữ liệu. Vui lòng không đóng trang web này.</p>
        </div>
      `,
      allowOutsideClick: false,
      background: '#1c1c28',
      color: '#ffffff',
      showConfirmButton: false
    });

    // Tạo các observables upload, trả về URL cũ nếu không chọn file mới (khi Edit)
    const audioUpload$ = this.selectedAudioFile 
      ? this.uploadService.uploadAudio(this.selectedAudioFile)
      : of({ url: this.songForm.audioFileUrl });

    const thumbnailUpload$ = this.selectedThumbnailFile
      ? this.uploadService.uploadImage(this.selectedThumbnailFile)
      : of({ url: this.songForm.thumbnailUrl });

    forkJoin({
      audio: audioUpload$,
      thumbnail: thumbnailUpload$
    }).subscribe({
      next: (res) => {
        const payload = {
          ownerUserId: this.libraryService.currentUserId,
          title,
          artistName: this.songForm.stageName.trim() || this.stageName,
          genreIds,
          duration: this.songForm.duration.trim() || '--:--',
          description,
          thumbnailUrl: res.thumbnail.url || 'https://via.placeholder.com/300x300?text=Melono',
          fileUrl: res.audio.url || 'assets/audio/demo-song.mp3',
        };

        if (this.managementMode === 'upload') {
          this.libraryService.createLocalSong(payload);
          Swal.update({
            icon: 'success',
            title: 'Thành công!',
            html: 'Bài hát mới đã được tải lên và gửi quản trị viên phê duyệt thành công!',
            showConfirmButton: false,
          });
          setTimeout(() => {
            Swal.close();
            this.managementMode = 'list';
            this.cdr.detectChanges();
          }, 2000);
        } else if (this.managementMode === 'edit' && this.editingSongId) {
          this.libraryService.updateArtistSong(
            this.editingSongId,
            this.libraryService.currentUserId,
            payload
          );
          Swal.update({
            icon: 'success',
            title: 'Thành công!',
            html: 'Cập nhật thông tin bài hát thành công!',
            showConfirmButton: false,
          });
          setTimeout(() => {
            Swal.close();
            this.managementMode = 'list';
            this.cdr.detectChanges();
          }, 2000);
        }

        this.selectedAudioFile = null;
        this.selectedThumbnailFile = null;
        this.songForm = this.createEmptyForm();
        this.editingSongId = null;
      },
      error: (err) => {
        Swal.update({
          icon: 'error',
          title: 'Lỗi tải lên!',
          html: err.error?.message || 'Có lỗi xảy ra trong quá trình tải tệp tin lên MinIO. Vui lòng thử lại.',
          showConfirmButton: true,
          confirmButtonColor: '#1ed760'
        });
      }
    });
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

  refreshManagement(): void {
    this.managementSearch = '';
    this.managementStatusFilter = 'ALL';
  }

  get editingRejectReason(): string {
    if (this.selectedSong?.status === 'Rejected') {
      return this.selectedSong.rejectReason || 'Vui lòng chỉnh sửa lại thông tin bài hát trước khi gửi lại.';
    }

    const editingSong = this.songs.find(song => song.id === this.editingSongId);
    if (editingSong?.status !== 'Rejected') return '';

    return editingSong.rejectReason || 'Vui lòng chỉnh sửa lại thông tin bài hát trước khi gửi lại.';
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

  private createEmptyForm(): SongFormData {
    return {
      title: '',
      genres: [],
      stageName: this.resolveStageName(),
      description: '',
      duration: '',
      audioFileName: '',
      audioFileUrl: '',
      thumbnailUrl: '',
    };
  }

  private toArtistSongItem(song: MusicSong, genres: MusicGenre[]): ArtistSongItem {
    const songGenres = song.genreIds ? song.genreIds.map(id => genres.find(item => item.id === id)?.name).filter(Boolean) as string[] : [];
    const genre = songGenres.length > 0 ? songGenres.join(', ') : 'Chưa phân loại';

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
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      if (currentUser.role === 'ARTIST' && currentUser.stageName) {
        return currentUser.stageName;
      }
      return currentUser.name || currentUser.username;
    }

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
