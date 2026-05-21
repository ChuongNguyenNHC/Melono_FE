import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { getSongStatusClass, getSongStatusLabel } from '../artist-display';
import { ArtistSongItem, ArtistViewMode, SongFormData, SongStatus } from '../artist.models';

@Component({
  selector: 'app-artist-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './artist-management.html',
})
export class ArtistManagement implements OnDestroy {
  @Input() mode: ArtistViewMode = 'list';
  private _songs: ArtistSongItem[] = [];
  currentPage = 1;
  pageSize = 5;

  @Input()
  set songs(value: ArtistSongItem[]) {
    const previousSongs = this._songs;
    this._songs = value || [];
    if (this.areSongListsDifferent(previousSongs, this._songs)) {
      this.currentPage = 1;
    }
  }

  private areSongListsDifferent(arr1: ArtistSongItem[], arr2: ArtistSongItem[]): boolean {
    if (arr1.length !== arr2.length) return true;
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i].id !== arr2[i].id || arr1[i].status !== arr2[i].status) {
        return true;
      }
    }
    return false;
  }


  get songs(): ArtistSongItem[] {
    return this._songs;
  }

  get totalPages(): number {
    return Math.ceil(this.songs.length / this.pageSize);
  }

  get paginatedSongs(): ArtistSongItem[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.songs.slice(start, start + this.pageSize);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }

  @Input() search = '';
  @Input() statusFilter: SongStatus | 'ALL' = 'ALL';
  @Input() songForm!: SongFormData;
  @Input() genreOptions: string[] = [];
  @Input() rejectedReason = '';

  @Output() searchChange = new EventEmitter<string>();
  @Output() statusFilterChange = new EventEmitter<SongStatus | 'ALL'>();
  @Output() refresh = new EventEmitter<void>();
  @Output() openUpload = new EventEmitter<void>();
  @Output() openEdit = new EventEmitter<ArtistSongItem>();
  @Output() openDelete = new EventEmitter<ArtistSongItem>();
  @Output() audioFileSelected = new EventEmitter<Event>();
  @Output() thumbnailFileSelected = new EventEmitter<Event>();
  @Output() audioFileRemoved = new EventEmitter<void>();
  @Output() thumbnailFileRemoved = new EventEmitter<void>();
  @Output() cancelForm = new EventEmitter<void>();
  @Output() submitForm = new EventEmitter<void>();
  @Output() hideSong = new EventEmitter<ArtistSongItem>();
  @Output() restoreSong = new EventEmitter<ArtistSongItem>();

  readonly getSongStatusClass = getSongStatusClass;
  readonly getSongStatusLabel = getSongStatusLabel;

  audioPlayer: HTMLAudioElement | null = null;
  isPreviewPlaying = false;
  previewCurrentTime = 0;
  previewDuration = 0;

  ngOnDestroy(): void {
    this.stopPreview();
  }

  stopPreview(): void {
    if (this.audioPlayer) {
      this.audioPlayer.pause();
      this.audioPlayer = null;
    }
    this.isPreviewPlaying = false;
    this.previewCurrentTime = 0;
    this.previewDuration = 0;
  }

  togglePreviewPlay(): void {
    if (!this.songForm?.audioFileUrl) return;

    if (!this.audioPlayer) {
      this.audioPlayer = new Audio(this.songForm.audioFileUrl);
      
      this.audioPlayer.addEventListener('loadedmetadata', () => {
        this.previewDuration = this.audioPlayer?.duration || 0;
      });

      this.audioPlayer.addEventListener('timeupdate', () => {
        this.previewCurrentTime = this.audioPlayer?.currentTime || 0;
      });

      this.audioPlayer.addEventListener('ended', () => {
        this.isPreviewPlaying = false;
        this.previewCurrentTime = 0;
      });
    } else if (this.audioPlayer.src !== this.songForm.audioFileUrl) {
      this.audioPlayer.pause();
      this.audioPlayer = new Audio(this.songForm.audioFileUrl);
      
      this.audioPlayer.addEventListener('loadedmetadata', () => {
        this.previewDuration = this.audioPlayer?.duration || 0;
      });

      this.audioPlayer.addEventListener('timeupdate', () => {
        this.previewCurrentTime = this.audioPlayer?.currentTime || 0;
      });

      this.audioPlayer.addEventListener('ended', () => {
        this.isPreviewPlaying = false;
        this.previewCurrentTime = 0;
      });
    }

    if (this.isPreviewPlaying) {
      this.audioPlayer.pause();
      this.isPreviewPlaying = false;
    } else {
      this.audioPlayer.play();
      this.isPreviewPlaying = true;
    }
  }

  formatPreviewDuration(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  seekPreview(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value);
    if (this.audioPlayer) {
      this.audioPlayer.currentTime = value;
      this.previewCurrentTime = value;
    }
  }

  isGenreSelected(genre: string): boolean {
    return this.songForm?.genres?.includes(genre) || false;
  }

  toggleGenre(genre: string): void {
    if (!this.songForm) return;
    if (!this.songForm.genres) {
      this.songForm.genres = [];
    }
    const idx = this.songForm.genres.indexOf(genre);
    if (idx > -1) {
      this.songForm.genres.splice(idx, 1);
    } else {
      this.songForm.genres.push(genre);
    }
  }

  trackById(_index: number, item: ArtistSongItem): string {
    return item.id;
  }
}
