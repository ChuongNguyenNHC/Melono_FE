import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MusicSong } from '../models/music-domain.models';
import { MusicLibraryService } from '../services/music-library.service';
import { Song } from '../services/music.service';
import { PlayerService } from '../services/player.service';
import { PlaylistService } from '../services/playlist.service';

@Component({
  selector: 'app-genre',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './genre.html',
  styleUrl: './genre.css',
})
export class Genre implements OnInit {
  readonly libraryService = inject(MusicLibraryService);
  private readonly playerService = inject(PlayerService);
  private readonly playlistService = inject(PlaylistService);
  readonly genres$ = this.libraryService.genres$;

  genreSearch = '';
  viewMode: 'default' | 'detail' = 'default';
  activeGenreId: string | null = null;
  currentPage = 1;
  pageSize = 12;

  ngOnInit(): void {
    // Only local songs are used; external API queries removed for speed
  }

  getSongCount(genreId: string): number {
    return this.libraryService.getSongsByGenre(genreId).length;
  }

  getSongsForGenre(genreId: string): Song[] {
    return this.libraryService.getSongsByGenre(genreId).map(s => this.mapMusicSongToSong(s));
  }

  get topGenres() {
    const genres = this.libraryService.snapshot.genres
      .filter(genre => this.getSongCount(genre.id) > 0)
      .sort((a, b) => this.getSongCount(b.id) - this.getSongCount(a.id));
    return genres.slice(0, 5);
  }

  get filteredGenres() {
    const keyword = this.genreSearch.trim().toLowerCase();
    const genres = this.libraryService.snapshot.genres
      .filter(genre => this.getSongCount(genre.id) > 0)
      .sort((a, b) => this.getSongCount(b.id) - this.getSongCount(a.id));

    if (!keyword) return genres.slice(0, 5);
    return genres.filter(genre => genre.name.toLowerCase().includes(keyword));
  }

  scrollToGenre(genreId: string): void {
    const element = document.getElementById('genre-section-' + genreId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  showGenreDetail(genreId: string): void {
    this.activeGenreId = genreId;
    this.viewMode = 'detail';
    this.currentPage = 1;
  }

  closeGenreDetail(): void {
    this.viewMode = 'default';
    this.activeGenreId = null;
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  getPages(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  get activeGenreName(): string {
    if (!this.activeGenreId) return '';
    return this.libraryService.snapshot.genres.find(g => g.id === this.activeGenreId)?.name || '';
  }

  get activeGenreSongs(): Song[] {
    if (!this.activeGenreId) return [];
    return this.getSongsForGenre(this.activeGenreId);
  }

  get paginatedGenreSongs(): Song[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.activeGenreSongs.slice(start, start + this.pageSize);
  }

  get totalItems(): number {
    return this.activeGenreSongs.length;
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize) || 1;
  }

  playDynamicGenreSong(song: Song, genreId: string): void {
    this.playerService.playSong(song, this.getSongsForGenre(genreId));
  }

  toggleLike(song: Song): void {
    this.playlistService.toggleLikeSong(song).subscribe({
      error: (err) => console.error('Failed to toggle like', err)
    });
  }

  isSongLiked(song: Song): boolean {
    return this.playlistService.isSongLiked(song);
  }

  private mapMusicSongToSong(s: MusicSong): Song {
    return {
      id: s.id,
      title: s.title,
      artist: s.artistName,
      coverUrl: s.thumbnailUrl || 'https://via.placeholder.com/300x300?text=Melono',
      previewUrl: s.fileUrl || s.previewUrl || '',
      duration: s.duration,
      plays: String(s.listenCount || 0),
      status: s.status
    };
  }
}
