import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Footer } from '../footer/footer';
import { MusicService, Song } from '../services/music.service';
import { PlayerService } from '../services/player.service';
import { AuthService } from '../services/auth.service';
import { MusicLibraryService } from '../services/music-library.service';
import { MusicSong } from '../models/music-domain.models';
import { PlaylistService } from '../services/playlist.service';

interface Playlist {
  id: number | string;
  title: string;
  description: string;
  coverUrl: string;
}

interface Artist {
  id: number;
  name: string;
  imageUrl: string;
}

interface Mood {
  id: number;
  name: string;
  color: string;
  bgColor: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, Footer],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing implements OnInit {
  musicService = inject(MusicService);
  playerService = inject(PlayerService);
  cdr = inject(ChangeDetectorRef);
  router = inject(Router);
  authService = inject(AuthService);
  readonly libraryService = inject(MusicLibraryService);
  playlistService = inject(PlaylistService);

  topSongs: Song[] = [];
  recentSongs: Song[] = [];

  get newLocalSongs(): Song[] {
    const allSongs = this.libraryService.snapshot.songs;
    const localApproved = allSongs.filter(s => s.status === 'APPROVED' && s.source === 'LOCAL');
    const sorted = [...localApproved].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
    return sorted.slice(0, 12).map(s => ({
      id: s.id,
      title: s.title,
      artist: s.artistName,
      coverUrl: s.thumbnailUrl || 'https://via.placeholder.com/300x300?text=Melono',
      previewUrl: s.fileUrl || s.previewUrl || '',
      duration: s.duration || '0:00',
      plays: this.musicService.getListenCount(s.id, s.listenCount),
      source: 'LOCAL'
    }));
  }
  
  navigateToPlaylist(id: number | string) {
    this.router.navigate(['/playlist', id]);
  }
  
  vpopSongs: Song[] = [];
  usukSongs: Song[] = [];
  itunesChartSongs: Song[] = [];
  localChartSongs: Song[] = [];
  private rawItunesArtists: any[] = [];

  showAllPlaylists = false;
  showAllSongs = false;
  
  get greeting(): string {
    const user = this.authService.currentUserValue;
    if (user && user.name) {
      return `Chào ${user.name}`;
    }
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Chào buổi sáng';
    } else if (hour < 18) {
      return 'Chào buổi chiều';
    } else {
      return 'Chào buổi tối';
    }
  }

  topArtists: Artist[] = [];
  userPlaylists: Playlist[] = [];

  staticPlaylists: Playlist[] = [
    {
      id: 1,
      title: 'Today\'s Top Hits',
      description: 'The most played songs right now.',
      coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&auto=format&fit=crop'
    },
    {
      id: 2,
      title: 'Chill Vibes',
      description: 'Relax and unwind with these smooth tracks.',
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300&auto=format&fit=crop'
    },
    {
      id: 3,
      title: 'Mega Hit Mix',
      description: 'A mega mix of 75 favorites from the last few years!',
      coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=300&auto=format&fit=crop'
    },
    {
      id: 4,
      title: 'Focus Flow',
      description: 'Uptempo instrumental hip hop to help you focus.',
      coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&auto=format&fit=crop'
    },
    {
      id: 5,
      title: 'Workout Beast',
      description: 'Get pumped with these high-energy tracks.',
      coverUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=300&auto=format&fit=crop'
    },
    {
      id: 6,
      title: 'Acoustic Covers',
      description: 'Beautiful acoustic renditions of popular songs.',
      coverUrl: 'https://images.unsplash.com/photo-1458560871784-56d23406c091?q=80&w=300&auto=format&fit=crop'
    },
    {
      id: 7,
      title: 'Midnight Jazz',
      description: 'Late night jazz to wind down your day.',
      coverUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=300&auto=format&fit=crop'
    },
    {
      id: 8,
      title: 'Electronic Dance',
      description: 'The best EDM tracks for your weekend party.',
      coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=300&auto=format&fit=crop'
    }
  ];

  get topPlaylists(): Playlist[] {
    return [...this.staticPlaylists, ...this.userPlaylists];
  }

  viewMode: 'default' | 'artists' | 'playlists' | 'songs' = 'default';
  currentPage = 1;
  pageSize = 12; // 12 items per page for 6-column detailed grid
  isProcessingLike = false;

  get totalItems(): number {
    if (this.viewMode === 'artists') return this.topArtists.length;
    if (this.viewMode === 'playlists') return this.topPlaylists.length;
    if (this.viewMode === 'songs') return this.topSongs.length;
    return 0;
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize) || 1;
  }

  get paginatedArtists(): Artist[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.topArtists.slice(start, start + this.pageSize);
  }

  get paginatedPlaylists(): Playlist[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.topPlaylists.slice(start, start + this.pageSize);
  }

  get paginatedSongs(): Song[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.topSongs.slice(start, start + this.pageSize);
  }

  setViewMode(mode: 'default' | 'artists' | 'playlists' | 'songs'): void {
    this.viewMode = mode;
    this.currentPage = 1;
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

  getDetailTitle(): string {
    if (this.viewMode === 'artists') return 'Nghệ sĩ nổi bật';
    if (this.viewMode === 'playlists') return 'Playlist được phát nhiều nhất';
    if (this.viewMode === 'songs') return 'Các bài hát được nghe nhiều nhất';
    return '';
  }

  isSongLiked(song: Song): boolean {
    return this.playlistService.isSongLiked(song);
  }

  toggleLike(song: Song): void {
    if (this.isProcessingLike) return;
    this.isProcessingLike = true;
    this.playlistService.toggleLikeSong(song).subscribe({
      next: () => {
        this.isProcessingLike = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Lỗi khi toggle like bài hát', err);
        this.isProcessingLike = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleShowAllPlaylists() {
    this.showAllPlaylists = !this.showAllPlaylists;
  }

  toggleShowAllSongs() {
    this.showAllSongs = !this.showAllSongs;
  }

  mixWithLocal(itunesSongs: Song[], filterFn?: (s: MusicSong) => boolean): Song[] {
    const allLocal = this.libraryService.snapshot.songs
      .filter(s => s.status === 'APPROVED' && s.source === 'LOCAL');
    
    const filteredLocal = filterFn ? allLocal.filter(filterFn) : allLocal;
    const sortedLocal = [...filteredLocal].sort((a, b) => (b.listenCount || 0) - (a.listenCount || 0));
    const mappedLocal = sortedLocal.map(s => this.mapLocalToSong(s));
    
    // Combine iTunes first, then append Local at the end
    const result: Song[] = [...itunesSongs, ...mappedLocal];
    
    const finalResult: Song[] = [];
    const seenIds = new Set<string | number>();
    for (const song of result) {
      if (!seenIds.has(song.id)) {
        seenIds.add(song.id);
        finalResult.push(song);
      }
    }
    
    return finalResult;
  }

  mixArtists(itunesArtists: any[]): any[] {
    const localApproved = this.libraryService.snapshot.songs
      .filter(s => s.status === 'APPROVED' && s.source === 'LOCAL');
      
    const localArtistsMap = new Map<string, any>();
    for (const song of localApproved) {
      if (!localArtistsMap.has(song.artistName)) {
        localArtistsMap.set(song.artistName, {
          id: song.id,
          name: song.artistName,
          imageUrl: song.thumbnailUrl || 'https://via.placeholder.com/300x300?text=Melono'
        });
      }
    }
    
    const localArtistsList = Array.from(localArtistsMap.values());
    const validItunes = itunesArtists || [];
    
    // Combine iTunes first, then append Local at the end
    const result: any[] = [...validItunes, ...localArtistsList];
    
    const finalResult: any[] = [];
    const seenNames = new Set<string>();
    for (const artist of result) {
      const lowerName = artist.name.trim().toLowerCase();
      if (!seenNames.has(lowerName)) {
        seenNames.add(lowerName);
        finalResult.push(artist);
      }
    }
    
    return finalResult;
  }

  private mapLocalToSong(s: MusicSong): Song {
    return {
      id: s.id,
      title: s.title,
      artist: s.artistName,
      coverUrl: s.thumbnailUrl || 'https://via.placeholder.com/300x300?text=Melono',
      previewUrl: s.fileUrl || s.previewUrl || '',
      duration: s.duration || '0:00',
      plays: this.musicService.getListenCount(s.id, s.listenCount),
      source: 'LOCAL',
      status: s.status
    };
  }

  ngOnInit() {
    // 1. Subscribe to User Playlists and map them to landing format, putting them at the end
    this.playlistService.playlists$.subscribe({
      next: (playlists) => {
        if (playlists) {
          this.userPlaylists = playlists.map(up => ({
            id: up.playlistId || '',
            title: up.name,
            description: `Playlist của bạn • ${up.songCount || 0} bài hát`,
            coverUrl: up.coverUrl || 'https://images.unsplash.com/photo-1458560871784-56d23406c091?q=80&w=300&auto=format&fit=crop'
          }));
          this.cdr.detectChanges();
        }
      }
    });

    setTimeout(() => {
      this.playlistService.getUserPlaylists().subscribe();
    });

    this.musicService.searchSongs('pop 2024', 12).subscribe({
      next: (songs) => {
        this.topSongs = this.mixWithLocal(songs);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to fetch top songs', err)
    });

    this.musicService.searchSongs('vpop', 4).subscribe({
      next: (songs) => {
        this.recentSongs = this.mixWithLocal(songs);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to fetch recent songs', err)
    });

    this.musicService.getTopArtists('trending pop', 8).subscribe({
      next: (artists) => {
        this.rawItunesArtists = artists;
        this.topArtists = this.mixArtists(artists);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to fetch top artists', err)
    });

    // Keep search fallback for general queries
    this.musicService.searchSongs('nhạc việt', 12).subscribe({
      next: (songs) => {
        this.vpopSongs = this.mixWithLocal(songs);
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });

    this.musicService.fetchChart('us', 12).subscribe({
      next: (songs) => {
        this.usukSongs = this.mixWithLocal(songs);
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });


    // Pure iTunes Charts
    this.musicService.fetchChart('vn', 10).subscribe({
      next: (songs) => {
        this.itunesChartSongs = songs;
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });

    // Pure Local Charts (Vietnam) and dynamic artists mixing
    this.libraryService.approvedSongs$.subscribe({
      next: (songs) => {
        const localApproved = songs.filter(s => s.source === 'LOCAL');
        const sorted = [...localApproved].sort((a, b) => (b.listenCount || 0) - (a.listenCount || 0));
        this.localChartSongs = sorted.slice(0, 10).map(s => this.mapLocalToSong(s));
        this.topArtists = this.mixArtists(this.rawItunesArtists);
        this.cdr.detectChanges();
      }
    });
  }

  playSong(song: Song, context?: Song[]) {
    this.playerService.playSong(song, context || this.topSongs);
  }
}

