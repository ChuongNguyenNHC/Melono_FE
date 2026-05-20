import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ItunesPlaylist, MusicService, Song } from '../services/music.service';
import { PlaylistService, Playlist } from '../services/playlist.service';
import { PlayerService } from '../services/player.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './library.html',
  styleUrl: './library.css',
})
export class Library implements OnInit {
  private readonly musicService = inject(MusicService);
  private readonly playlistService = inject(PlaylistService);
  private readonly playerService = inject(PlayerService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  isPlaylistLocked(playlist: Playlist): boolean {
    const user = this.authService.currentUserValue;
    if (!user) return false;
    // Bị khóa nếu ở trạng thái PRIVATE và chủ sở hữu không phải là user hiện tại
    return playlist.status === 'PRIVATE' && playlist.userId !== user.id;
  }

  playlists: Playlist[] = [];
  followedPlaylists: Playlist[] = [];
  likedSongs: Song[] = [];
  playlistName = '';
  playlistStatus: 'PUBLIC' | 'PRIVATE' = 'PRIVATE';
  suggestedPlaylists: ItunesPlaylist[] = this.defaultSuggestedPlaylists;
  showAllSuggested = false;

  ngOnInit(): void {
    // 1. Kết nối Real Playlist API
    this.playlistService.playlists$.subscribe({
      next: (data) => {
        this.playlists = data;
        this.cdr.detectChanges();
      }
    });

    // 1b. Kết nối Followed Playlist API
    this.playlistService.followedPlaylists$.subscribe({
      next: (data) => {
        this.followedPlaylists = data;
        this.cdr.detectChanges();
      }
    });

    // 2. Kết nối Real Liked Songs API
    this.playlistService.likedSongs$.subscribe({
      next: (data) => {
        this.likedSongs = data;
        this.cdr.detectChanges();
      }
    });

    // Trì hoãn việc gọi API để Angular hoàn thành Change Detection đầu tiên
    setTimeout(() => {
      this.playlistService.getUserPlaylists().subscribe();
      this.playlistService.getFollowedPlaylists().subscribe();
      this.playlistService.getLikedSongs().subscribe();
    });

    // 3. Lấy gợi ý iTunes
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

    this.playlistService.createPlaylist(name, this.playlistStatus).subscribe({
      next: () => {
        this.playlistName = '';
        this.playlistStatus = 'PRIVATE';
      },
      error: err => console.error('Error creating playlist via API', err)
    });
  }

  openPlaylist(playlist: Playlist): void {
    if (this.isPlaylistLocked(playlist)) {
      return; // Chặn click vào xem chi tiết playlist riêng tư của người khác
    }
    this.router.navigate(['/playlist', playlist.playlistId]);
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

  isProcessingLike = false;

  trackBySongId(index: number, song: Song): string | number {
    return song.id;
  }

  // Bỏ thích bài hát trực tiếp qua Real API
  toggleLike(song: Song): void {
    if (this.isProcessingLike) {
      console.log('%c[UI - Library] Đang xử lý yêu cầu Like/Unlike trước đó, bỏ qua click này.', 'color: #e74c3c;');
      return;
    }

    this.isProcessingLike = true;
    console.log(`%c[UI - Library] Người dùng bấm nút Bỏ thích bài hát: "${song.title}" trực tiếp trong thư viện`, 'color: #f1c40f; font-weight: bold;');
    
    this.playlistService.toggleLikeSong(song).subscribe({
      next: () => {
        console.log(`%c[UI - Library] Đã xóa thành công bài hát "${song.title}" khỏi Thư viện!`, 'color: #2ecc71; font-weight: bold;');
        this.isProcessingLike = false;
      },
      error: (err) => {
        console.error('[UI - Library] Lỗi khi toggle like bài hát', err);
        this.isProcessingLike = false;
      }
    });
  }

  // Phát nhạc từ danh sách bài hát yêu thích chuẩn hóa
  playSong(song: Song, contextSongs: Song[]): void {
    this.playerService.playSong(song, contextSongs, true);
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

  getPlaylistTheme(playlist: Playlist, fallbackIndex: number): string {
    return this.getTheme(fallbackIndex);
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
