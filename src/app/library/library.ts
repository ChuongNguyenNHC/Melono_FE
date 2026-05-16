import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MusicPlaylist } from '../models/music-domain.models';
import { MusicLibraryService } from '../services/music-library.service';
import { ItunesPlaylist, MusicService } from '../services/music.service';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './library.html',
  styleUrl: './library.css',
})
export class Library implements OnInit {
  readonly libraryService = inject(MusicLibraryService);
  private readonly musicService = inject(MusicService);
  private readonly router = inject(Router);
  readonly library$ = this.libraryService.currentUserLibrary$;

  playlistName = '';
  playlistStatus: 'PUBLIC' | 'PRIVATE' = 'PRIVATE';
  suggestedPlaylists: ItunesPlaylist[] = this.defaultSuggestedPlaylists;
  showAllSuggested = false;

  ngOnInit(): void {
    this.musicService.fetchTopAlbums('vn', 12).subscribe({
      next: playlists => {
        if (playlists.length) {
          this.suggestedPlaylists = playlists;
        }
      },
      error: error => console.error(error),
    });
  }

  createPlaylist(): void {
    const name = this.playlistName.trim();
    if (!name) return;

    this.libraryService.createPlaylist({
      userId: this.libraryService.currentUserId,
      name,
      status: this.playlistStatus,
    });

    this.playlistName = '';
    this.playlistStatus = 'PRIVATE';
  }

  openPlaylist(playlist: MusicPlaylist): void {
    this.router.navigate(['/playlist', playlist.id]);
  }

  openSuggestedPlaylist(playlist: ItunesPlaylist): void {
    this.router.navigate(['/playlist', `suggested-${playlist.id}`], {
      queryParams: {
        title: playlist.title,
        artist: playlist.artist,
        cover: playlist.coverUrl,
        query: playlist.query,
      },
    });
  }

  toggleShowAllSuggested(): void {
    this.showAllSuggested = !this.showAllSuggested;
  }

  get playlistThemes(): string[] {
    return [
      'from-[#d9b466] via-[#9b728e] to-[#5b2d90]',
      'from-[#f7d047] via-[#e99a24] to-[#c15a00]',
      'from-[#ef4444] via-[#b63f30] to-[#7c2d12]',
      'from-[#93c5fd] via-[#60a5fa] to-[#312e81]',
      'from-[#34d399] via-[#10b981] to-[#064e3b]',
    ];
  }

  getTheme(index: number): string {
    return this.playlistThemes[index % this.playlistThemes.length];
  }

  getPlaylistTheme(playlist: MusicPlaylist, fallbackIndex: number): string {
    return this.getTheme(playlist.coverTheme ?? fallbackIndex);
  }

  private get defaultSuggestedPlaylists(): ItunesPlaylist[] {
    return [
      {
        id: 'today-top-hits',
        title: 'Today\'s Top Hits',
        artist: 'iTunes',
        description: 'The most played songs right now.',
        coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&auto=format&fit=crop',
        query: 'top hits pop',
      },
      {
        id: 'chill-vibes',
        title: 'Chill Vibes',
        artist: 'iTunes',
        description: 'Relax and unwind with these smooth tracks.',
        coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300&auto=format&fit=crop',
        query: 'lofi chill',
      },
      {
        id: 'mega-hit-mix',
        title: 'Mega Hit Mix',
        artist: 'iTunes',
        description: 'A mega mix of 75 favorites from the last few years.',
        coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=300&auto=format&fit=crop',
        query: 'mega hit mix',
      },
      {
        id: 'focus-flow',
        title: 'Focus Flow',
        artist: 'iTunes',
        description: 'Uptempo instrumental hip hop to help you focus.',
        coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&auto=format&fit=crop',
        query: 'focus instrumental',
      },
      {
        id: 'workout-beast',
        title: 'Workout Beast',
        artist: 'iTunes',
        description: 'Get pumped with these high-energy tracks.',
        coverUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=300&auto=format&fit=crop',
        query: 'workout edm',
      },
      {
        id: 'acoustic-covers',
        title: 'Acoustic Covers',
        artist: 'iTunes',
        description: 'Beautiful acoustic renditions of popular songs.',
        coverUrl: 'https://images.unsplash.com/photo-1458560871784-56d23406c091?q=80&w=300&auto=format&fit=crop',
        query: 'acoustic cover',
      },
      {
        id: 'midnight-jazz',
        title: 'Midnight Jazz',
        artist: 'iTunes',
        description: 'Late night jazz to wind down your day.',
        coverUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=300&auto=format&fit=crop',
        query: 'midnight jazz',
      },
      {
        id: 'electronic-dance',
        title: 'Electronic Dance',
        artist: 'iTunes',
        description: 'The best EDM tracks for your weekend party.',
        coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=300&auto=format&fit=crop',
        query: 'electronic dance',
      },
    ];
  }
}
