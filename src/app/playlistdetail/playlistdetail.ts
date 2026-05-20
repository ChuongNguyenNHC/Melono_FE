import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Footer } from '../footer/footer';
import { MusicPlaylist, MusicSong } from '../models/music-domain.models';
import { MusicLibraryService } from '../services/music-library.service';
import { MusicService, Song } from '../services/music.service';
import { PlayerService } from '../services/player.service';
import { PlaylistService } from '../services/playlist.service';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';

interface PlaylistView {
  title: string;
  description: string;
  coverUrl?: string;
  bgColor: string;
  query: string;
  status?: 'PUBLIC' | 'PRIVATE';
  coverTheme?: number;
}

@Component({
  selector: 'app-playlistdetail',
  standalone: true,
  imports: [CommonModule, FormsModule, Footer, RouterModule],
  templateUrl: './playlistdetail.html',
  styleUrl: './playlistdetail.css',
})
export class PlaylistDetail implements OnInit, OnDestroy {
  private readonly musicService = inject(MusicService);
  private readonly playerService = inject(PlayerService);
  private readonly libraryService = inject(MusicLibraryService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly playlistService = inject(PlaylistService);
  private readonly authService = inject(AuthService);

  private followedPlaylistsSub: Subscription | null = null;

  playlistId: string | null = null;
  playlistData: PlaylistView = this.fallbackPlaylist;
  localPlaylist: MusicPlaylist | null = null;
  songs: Song[] = [];
  editingName = '';
  editingStatus: 'PUBLIC' | 'PRIVATE' = 'PRIVATE';
  editingCoverUrl = '';
  selectedTheme = 0;
  shareMessage = '';

  readonly playlistThemes = [
    'from-[#d9b466] via-[#9b728e] to-[#5b2d90]',
    'from-[#f7d047] via-[#e99a24] to-[#c15a00]',
    'from-[#ef4444] via-[#b63f30] to-[#7c2d12]',
    'from-[#93c5fd] via-[#60a5fa] to-[#312e81]',
    'from-[#34d399] via-[#10b981] to-[#064e3b]',
  ];

  private readonly defaultSuggestedPlaylists: Record<string, PlaylistView> = {
    '1': {
      title: 'Today\'s Top Hits',
      description: 'The most played songs right now.',
      coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=500&auto=format&fit=crop',
      bgColor: 'from-[#651c20]',
      query: 'top hits pop',
    },
    '2': {
      title: 'Chill Vibes',
      description: 'Relax and unwind with these smooth tracks.',
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop',
      bgColor: 'from-[#352528]',
      query: 'lofi chill',
    },
    '3': {
      title: 'Mega Hit Mix',
      description: 'A mega mix of 75 favorites from the last few years.',
      coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=500&auto=format&fit=crop',
      bgColor: 'from-[#2e1d52]',
      query: 'mega hit mix',
    },
    '4': {
      title: 'Focus Flow',
      description: 'Uptempo instrumental hip hop to help you focus.',
      coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=500&auto=format&fit=crop',
      bgColor: 'from-[#112429]',
      query: 'focus instrumental',
    },
    '5': {
      title: 'Workout Beast',
      description: 'Get pumped with these high-energy tracks.',
      coverUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=500&auto=format&fit=crop',
      bgColor: 'from-[#1d201c]',
      query: 'workout edm',
    },
    '6': {
      title: 'Acoustic Covers',
      description: 'Beautiful acoustic renditions of popular songs.',
      coverUrl: 'https://images.unsplash.com/photo-1458560871784-56d23406c091?q=80&w=500&auto=format&fit=crop',
      bgColor: 'from-[#1c1c1c]',
      query: 'acoustic cover',
    },
    '7': {
      title: 'Midnight Jazz',
      description: 'Late night jazz to wind down your day.',
      coverUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=500&auto=format&fit=crop',
      bgColor: 'from-[#42312b]',
      query: 'midnight jazz',
    },
    '8': {
      title: 'Electronic Dance',
      description: 'The best EDM tracks for your weekend party.',
      coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=500&auto=format&fit=crop',
      bgColor: 'from-[#144246]',
      query: 'electronic dance',
    },
  };

  private get fallbackPlaylist(): PlaylistView {
    return {
      title: 'Playlist của bạn',
      description: 'Tận hưởng âm nhạc theo phong cách riêng.',
      bgColor: 'from-[#2b4239]',
      query: 'vietnam',
    };
  }

  ngOnInit(): void {
    this.playlistService.getLikedSongs().subscribe();
    this.playlistService.getFollowedPlaylists().subscribe();
    this.followedPlaylistsSub = this.playlistService.followedPlaylists$.subscribe(() => {
      this.cdr.detectChanges();
    });
    this.route.paramMap.subscribe(params => {
      this.playlistId = params.get('id');
      this.loadPlaylist();
    });
  }

  ngOnDestroy(): void {
    if (this.followedPlaylistsSub) {
      this.followedPlaylistsSub.unsubscribe();
    }
  }

  playSong(song: Song): void {
    this.playerService.playSong(song, this.songs, true);
  }

  playAll(): void {
    if (this.songs.length) {
      this.playerService.playSong(this.songs[0], this.songs, true);
    }
  }

  savePlaylist(): void {
    if (!this.localPlaylist || !this.editingName.trim()) return;

    const idStr = String(this.localPlaylist.id);
    const isSuggested = ['1', '2', '3', '4', '5', '6', '7', '8'].includes(idStr);

    if (!isSuggested && !idStr.startsWith('pl')) {
      this.playlistService.updatePlaylist(idStr, this.editingName.trim(), this.editingStatus).subscribe({
        next: (updatedPlaylist) => {
          this.localPlaylist = {
            ...this.localPlaylist!,
            name: this.editingName.trim(),
            status: this.editingStatus,
          };
          this.playlistData = this.buildLocalPlaylistData(this.localPlaylist);
          this.shareMessage = 'Đã lưu thay đổi';
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error updating playlist on backend', err)
      });
    } else {
      this.libraryService.updatePlaylist(this.localPlaylist.id, {
        name: this.editingName.trim(),
        status: this.editingStatus,
        coverTheme: this.selectedTheme,
        coverUrl: this.editingCoverUrl.trim(),
      });

      this.localPlaylist = {
        ...this.localPlaylist,
        name: this.editingName.trim(),
        status: this.editingStatus,
        coverTheme: this.selectedTheme,
        coverUrl: this.editingCoverUrl.trim(),
      };
      this.playlistData = this.buildLocalPlaylistData(this.localPlaylist);
      this.shareMessage = 'Đã lưu thay đổi';
      this.cdr.detectChanges();
    }
  }

  sharePlaylist(): void {
    const text = window.location.href;
    navigator.clipboard?.writeText(text);
    this.shareMessage = 'Đã sao chép liên kết chia sẻ';
  }

  deletePlaylist(): void {
    if (!this.localPlaylist) return;

    const idStr = String(this.localPlaylist.id);
    const isSuggested = ['1', '2', '3', '4', '5', '6', '7', '8'].includes(idStr);

    if (!isSuggested && !idStr.startsWith('pl')) {
      this.playlistService.deletePlaylist(idStr).subscribe({
        next: () => {
          this.goBackToLibrary();
        },
        error: (err) => console.error('Error deleting playlist', err)
      });
    } else {
      this.libraryService.deletePlaylist(this.localPlaylist.id);
      this.goBackToLibrary();
    }
  }

  goBackToLibrary(): void {
    this.router.navigate(['/library']);
  }

  toggleLike(song: Song): void {
    const currentlyLiked = this.isSongLiked(song);
    console.log(`%c[UI - Playlist Detail] Người dùng bấm nút ${currentlyLiked ? 'Bỏ thích' : 'Thích'} bài hát: "${song.title}" trong playlist`, 'color: #f1c40f; font-weight: bold;');
    this.playlistService.toggleLikeSong(song).subscribe({
      next: () => {
        console.log(`%c[UI - Playlist Detail] Đã cập nhật trạng thái "Thích" thành công trên giao diện playlist cho bài hát: "${song.title}"!`, 'color: #2ecc71; font-weight: bold;');
        this.cdr.detectChanges();
      }
    });
  }

  removeSong(song: Song): void {
    if (!this.localPlaylist) return;

    const idStr = String(this.localPlaylist.id);
    const isSuggested = ['1', '2', '3', '4', '5', '6', '7', '8'].includes(idStr);

    console.log(`%c[UI - Playlist Detail] Người dùng bấm nút "Xóa khỏi playlist" bài hát: "${song.title}" (ID: ${song.id})`, 'color: #e74c3c; font-weight: bold;');

    if (!isSuggested && !idStr.startsWith('pl')) {
      // Backend Playlist
      this.playlistService.removeSongFromPlaylist(idStr, String(song.id)).subscribe({
        next: () => {
          console.log(`%c[UI - Playlist Detail] Đã xóa bài hát khỏi backend playlist thành công!`, 'color: #2ecc71; font-weight: bold;');
          this.songs = this.songs.filter(s => s.id !== song.id);
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error removing song from playlist', err)
      });
    } else {
      // Local/mock Playlist
      this.libraryService.removeSongFromPlaylist(this.localPlaylist.id, String(song.id));
      console.log(`%c[UI - Playlist Detail] Đã xóa bài hát khỏi mock local library playlist thành công!`, 'color: #2ecc71; font-weight: bold;');
      this.songs = this.songs.filter(s => s.id !== song.id);
      this.cdr.detectChanges();
    }
  }

  isSongLiked(song: Song): boolean {
    return this.playlistService.isSongLiked(song);
  }

  trackBySongId(index: number, song: Song): string | number {
    return song.id;
  }

  get currentUser() {
    return this.authService.currentUserValue;
  }

  isOwner(): boolean {
    if (!this.localPlaylist) return true; // Suggested system playlists default to true for basic actions
    if (!this.currentUser) return false;
    return String(this.localPlaylist.userId) === String(this.currentUser.id);
  }

  isPlaylistLocked(): boolean {
    if (!this.localPlaylist) return false;
    // Khóa nếu trạng thái là PRIVATE và người dùng hiện tại không phải chủ sở hữu
    return this.localPlaylist.status === 'PRIVATE' && !this.isOwner();
  }

  isFollowed(): boolean {
    if (!this.playlistId) return false;
    return this.playlistService.isPlaylistFollowed(this.playlistId);
  }

  toggleFollowPlaylist(): void {
    if (!this.playlistId) return;
    
    const currentlyFollowed = this.isFollowed();
    console.log(`%c[UI - Playlist Detail] Người dùng bấm nút ${currentlyFollowed ? 'Bỏ theo dõi' : 'Theo dõi'} playlist: "${this.playlistData.title}"`, 'color: #3498db; font-weight: bold;');
    
    if (currentlyFollowed) {
      this.playlistService.unfollowPlaylist(this.playlistId).subscribe({
        next: () => {
          console.log('%c[UI - Playlist Detail] Đã bỏ theo dõi thành công!', 'color: #2ecc71; font-weight: bold;');
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error unfollowing playlist', err)
      });
    } else {
      this.playlistService.followPlaylist(this.playlistId).subscribe({
        next: () => {
          console.log('%c[UI - Playlist Detail] Đã theo dõi thành công!', 'color: #2ecc71; font-weight: bold;');
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error following playlist', err)
      });
    }
  }

  getTheme(index: number): string {
    return this.playlistThemes[index % this.playlistThemes.length];
  }

  private loadPlaylist(): void {
    const id = this.playlistId || '1';
    
    // Nếu là playlist lưu trữ ở Local Storage mock
    if (id.startsWith('pl')) {
      const local = this.libraryService.getPlaylistById(id);
      if (local) {
        this.localPlaylist = local;
        this.editingName = local.name;
        this.editingStatus = local.status;
        const localSongs = this.libraryService.getPlaylistSongs(local.id).map(song => this.toPlayableSong(song));
        this.songs = localSongs;
        
        // Tự động sinh coverUrl cho local mock playlist dựa vào bài hát cuối cùng
        if (localSongs.length > 0) {
          const lastSong = localSongs[localSongs.length - 1];
          this.editingCoverUrl = lastSong.coverUrl || '';
          local.coverUrl = lastSong.coverUrl;
        } else {
          this.editingCoverUrl = '';
          local.coverUrl = undefined;
        }

        this.selectedTheme = local.coverTheme ?? 0;
        this.playlistData = this.buildLocalPlaylistData(local);
        this.cdr.detectChanges();
        return;
      }
    }

    // Nếu không phải playlist gợi ý mặc định (1-8), thì là playlist thật từ Backend!
    const isSuggested = ['1', '2', '3', '4', '5', '6', '7', '8'].includes(id);
    if (!isSuggested) {
      this.playlistService.getPlaylistById(id).subscribe({
        next: (playlist) => {
          const mappedPlaylist: MusicPlaylist = {
            id: playlist.playlistId!,
            userId: playlist.userId,
            name: playlist.name,
            status: playlist.status,
            coverTheme: 0,
            coverUrl: playlist.coverUrl,
            createdAt: playlist.createdAt || new Date().toISOString()
          };
          this.localPlaylist = mappedPlaylist;
          this.editingName = playlist.name;
          this.editingStatus = playlist.status;
          this.editingCoverUrl = playlist.coverUrl || '';
          this.selectedTheme = 0;
          this.playlistData = this.buildLocalPlaylistData(mappedPlaylist);
          
          this.playlistService.getPlaylistSongs(playlist.playlistId!).subscribe({
            next: (songs) => {
              this.songs = songs;
              // Tự động sinh coverUrl cho backend playlist dựa vào bài hát cuối cùng
              if (songs && songs.length > 0) {
                const lastSong = songs[songs.length - 1];
                this.editingCoverUrl = lastSong.coverUrl || '';
                this.playlistData = {
                  ...this.playlistData,
                  coverUrl: lastSong.coverUrl
                };
              } else {
                this.editingCoverUrl = '';
                this.playlistData = {
                  ...this.playlistData,
                  coverUrl: undefined
                };
              }
              this.cdr.detectChanges();
            },
            error: (err) => console.error('Error fetching playlist songs from backend', err)
          });
        },
        error: (err) => {
          console.error('Error loading playlist from backend', err);
          this.goBackToLibrary();
        }
      });
      return;
    }

    const params = this.route.snapshot.queryParamMap;
    const title = params.get('title');
    const artist = params.get('artist') || 'iTunes';
    const coverUrl = params.get('cover') || undefined;
    const query = params.get('query') || title || 'vietnam hits';

    this.localPlaylist = null;
    this.playlistData = title
      ? {
          title,
          description: `${artist} • playlist gợi ý từ iTunes`,
          coverUrl,
          bgColor: 'from-[#292238]',
          query,
        }
      : this.defaultSuggestedPlaylists[id] || {
          title: 'Playlist iTunes',
          description: 'Playlist gợi ý từ iTunes.',
          bgColor: 'from-[#292238]',
          query,
        };
    this.fetchSuggestedSongs(this.playlistData.query);
  }

  private fetchSuggestedSongs(query: string): void {
    this.musicService.searchItunesSongs(query, 20).subscribe({
      next: songs => {
        this.songs = songs;
        this.cdr.detectChanges();
      },
      error: error => console.error(error),
    });
  }

  private buildLocalPlaylistData(playlist: MusicPlaylist): PlaylistView {
    return {
      title: playlist.name,
      description: playlist.status === 'PUBLIC'
        ? 'Playlist công khai trong thư viện Melono.'
        : 'Playlist riêng tư của bạn.',
      coverUrl: playlist.coverUrl,
      bgColor: this.getTheme(playlist.coverTheme ?? 0),
      query: 'vietnam',
      status: playlist.status,
      coverTheme: playlist.coverTheme ?? 0,
    };
  }

  private toPlayableSong(song: MusicSong): Song {
    return {
      id: song.id,
      title: song.title,
      artist: song.artistName,
      coverUrl: song.thumbnailUrl,
      previewUrl: song.fileUrl || song.previewUrl || '',
      duration: song.duration,
      plays: 'Local',
    };
  }
}
