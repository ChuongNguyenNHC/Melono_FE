import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { MusicService, Song } from '../services/music.service';
import { PlayerService } from '../services/player.service';
import { MusicLibraryService } from '../services/music-library.service';
import { PlaylistService, Playlist } from '../services/playlist.service';
import { Footer } from '../footer/footer';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-song-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, Footer],
  templateUrl: './songdetail.html',
  styleUrl: './songdetail.css'
})
export class SongDetail implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private musicService = inject(MusicService);
  playerService = inject(PlayerService);
  libraryService = inject(MusicLibraryService);
  private playlistService = inject(PlaylistService);
  private cdr = inject(ChangeDetectorRef);
  private titleService = inject(Title);
  
  songId: string | null = null;
  song: Song | null = null;
  artistSongs: Song[] = [];
  isLoading = true;
  isPlayingSong = false;
  
  userPlaylists: Playlist[] = [];
  showPlaylistDropdown = false;
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  private clickListener: (() => void) | null = null;

  private sub: Subscription | null = null;
  private isPlayingSub: Subscription | null = null;
  private currentSongSub: Subscription | null = null;
  private songsSub: Subscription | null = null;

  ngOnInit() {
    this.sub = this.route.paramMap.subscribe(params => {
      this.songId = params.get('id');
      if (this.songId) {
        this.loadSongDetails(this.songId);
      }
    });

    this.currentSongSub = this.playerService.currentSong$.subscribe(() => {
      this.checkPlayingState();
    });

    this.isPlayingSub = this.playerService.isPlaying$.subscribe(() => {
      this.checkPlayingState();
    });

    this.songsSub = this.libraryService.songs$.subscribe(songs => {
      if (this.song && this.songId) {
        const updatedSong = songs.find(s => String(s.id) === String(this.songId));
        if (updatedSong) {
          this.song.plays = this.musicService.getListenCount(updatedSong.id, updatedSong.listenCount);
          this.cdr.detectChanges();
        }
      }
    });

    this.loadUserPlaylists();
    this.playlistService.getLikedSongs().subscribe();

    this.clickListener = () => {
      if (this.showPlaylistDropdown) {
        this.showPlaylistDropdown = false;
        this.cdr.detectChanges();
      }
    };
    window.addEventListener('click', this.clickListener);
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
    if (this.currentSongSub) this.currentSongSub.unsubscribe();
    if (this.isPlayingSub) this.isPlayingSub.unsubscribe();
    if (this.songsSub) this.songsSub.unsubscribe();
    if (this.clickListener) {
      window.removeEventListener('click', this.clickListener);
    }
  }

  loadSongDetails(id: string) {
    this.isLoading = true;
    this.musicService.getSongDetail(id).subscribe({
      next: data => {
        this.song = data;
        this.isLoading = false;
        this.checkPlayingState();
        this.cdr.detectChanges();
        
        if (data) {
          // Cập nhật tiêu đề tab động, tự động thêm dấu ba chấm nếu tiêu đề bài quá dài
          let displayTitle = data.title;
          if (displayTitle.length > 25) {
            displayTitle = displayTitle.substring(0, 25) + '...';
          }
          this.titleService.setTitle(`${displayTitle} | Melono`);
          
          if (data.artist) {
            this.fetchArtistSongs(data.artist);
          }
        }
      },
      error: err => {
        console.error(err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  fetchArtistSongs(artist: string) {
    // Lấy bài hát cùng nghệ sĩ từ database nội bộ (chỉ bài đã duyệt, loại trừ bài hiện tại)
    const allSongs = this.libraryService.snapshot.songs;
    const normalizedArtist = artist.trim().toLowerCase();
    const localArtistSongs = allSongs
      .filter(s =>
        s.status === 'APPROVED' &&
        s.artistName.trim().toLowerCase() === normalizedArtist &&
        String(s.id) !== String(this.songId)
      )
      .slice(0, 6)
      .map(s => ({
        id: s.id,
        title: s.title,
        artist: s.artistName,
        coverUrl: s.thumbnailUrl,
        previewUrl: s.fileUrl || s.previewUrl || '',
        duration: s.duration,
        plays: '0',
      } as Song));

    this.artistSongs = localArtistSongs;
    this.cdr.detectChanges();
  }

  checkPlayingState() {
    if (!this.song) {
      this.isPlayingSong = false;
      return;
    }
    const currentPlaying = this.playerService.currentSong;
    if (currentPlaying) {
      const isSameId = String(currentPlaying.id) === String(this.song.id) ||
                       String(currentPlaying.id).replace('itunes-', '') === String(this.song.id).replace('itunes-', '');
      this.isPlayingSong = isSameId && this.playerService.isPlaying;
    } else {
      this.isPlayingSong = false;
    }
    this.cdr.detectChanges();
  }

  togglePlay() {
    if (!this.song) return;
    const currentPlaying = this.playerService.currentSong;
    const isSameId = currentPlaying && (
      String(currentPlaying.id) === String(this.song.id) ||
      String(currentPlaying.id).replace('itunes-', '') === String(this.song.id).replace('itunes-', '')
    );

    if (isSameId) {
      this.playerService.togglePlay();
    } else {
      this.playerService.playSong(this.song);
    }
  }

  likeSong() {
    if (!this.song) return;
    const currentlyLiked = this.isLiked();
    console.log(`%c[UI - Click] Người dùng bấm nút ${currentlyLiked ? 'Bỏ thích' : 'Thích'} bài hát: "${this.song.title}" (ID: ${this.song.id})`, 'color: #f1c40f; font-weight: bold;');
    
    this.playlistService.toggleLikeSong(this.song).subscribe({
      next: () => {
        console.log(`%c[UI - Success] Trạng thái "Thích" của bài hát "${this.song?.title}" đã được cập nhật thành công trên UI!`, 'color: #2ecc71; font-weight: bold;');
        this.cdr.detectChanges();
      },
      error: err => console.error('Lỗi khi thích bài hát:', err)
    });
  }

  isLiked(): boolean {
    if (!this.song) return false;
    return this.playlistService.isSongLiked(this.song);
  }

  playRecommended(song: Song) {
    this.playerService.playSong(song, [song, ...this.artistSongs]);
    
    // Chuẩn hóa ID bài hát trước khi điều hướng
    let targetId = String(song.id);
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    // Chỉ thêm prefix itunes- cho ID dạng số thuần (từ iTunes API), không thêm cho UUID hoặc local ID
    if (!targetId.startsWith('s') && !targetId.startsWith('itunes-') && !uuidRegex.test(targetId)) {
      targetId = `itunes-${targetId}`;
    }
    
    // Điều hướng sang trang chi tiết bài hát mới để cập nhật thông tin đĩa than
    this.router.navigate(['/song', targetId]);
  }

  goBack() {
    window.history.back();
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  loadUserPlaylists() {
    this.playlistService.getUserPlaylists().subscribe({
      next: (playlists) => {
        this.userPlaylists = playlists;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Không thể tải danh sách phát:', err);
      }
    });
  }

  togglePlaylistDropdown(event: Event) {
    event.stopPropagation();
    this.showPlaylistDropdown = !this.showPlaylistDropdown;
    if (this.showPlaylistDropdown) {
      this.loadUserPlaylists();
    }
    this.cdr.detectChanges();
  }

  navigateToCreatePlaylist() {
    this.showPlaylistDropdown = false;
    this.router.navigate(['/library']);
  }

  addToPlaylist(playlistId: string | undefined) {
    if (!this.song || !playlistId) return;
    this.playlistService.addSongToPlaylist(playlistId, this.song).subscribe({
      next: () => {
        this.showPlaylistDropdown = false;
        this.showToastMessage('Đã thêm bài hát vào danh sách phát thành công!', 'success');
      },
      error: (err) => {
        console.error(err);
        this.showToastMessage('Lỗi khi thêm bài hát vào danh sách phát.', 'error');
      }
    });
  }

  private showToastMessage(message: string, type: 'success' | 'error') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.showToast = false;
      this.cdr.detectChanges();
    }, 3000);
  }
}
