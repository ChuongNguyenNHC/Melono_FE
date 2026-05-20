import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PlayerService } from '../services/player.service';
import { MusicLibraryService } from '../services/music-library.service';
import { PlaylistService } from '../services/playlist.service';

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './player.html',
  styleUrl: './player.css'
})
export class PlayerComponent implements OnInit, OnDestroy {
  @Input() isExpanded = true;
  playerService = inject(PlayerService);
  musicLibraryService = inject(MusicLibraryService);
  playlistService = inject(PlaylistService);
  cdr = inject(ChangeDetectorRef);
  
  volume = 1;
  previousVolume = 1;
  
  currentTime = 0;
  duration = 0;

  isShuffleDisabled(song: any): boolean {
    return !song || !song.id || !this.playerService.isPlayingFromPlaylist || this.playerService.queue.length <= 1;
  }
  
  private timeUpdateHandler = () => {
    this.currentTime = this.playerService.audio.currentTime;
    this.cdr.detectChanges();
  };
  
  private loadedMetadataHandler = () => {
    this.duration = this.playerService.audio.duration;
    this.cdr.detectChanges();
  };

  ngOnInit() {
    // Lấy giá trị hiện tại ngay lập tức nếu nhạc đã và đang phát từ trước
    if (this.playerService.audio) {
      this.currentTime = this.playerService.audio.currentTime || 0;
      this.duration = this.playerService.audio.duration || 0;
    }
    
    this.playerService.audio.addEventListener('timeupdate', this.timeUpdateHandler);
    this.playerService.audio.addEventListener('loadedmetadata', this.loadedMetadataHandler);
  }

  ngOnDestroy() {
    if (this.playerService.audio) {
      this.playerService.audio.removeEventListener('timeupdate', this.timeUpdateHandler);
      this.playerService.audio.removeEventListener('loadedmetadata', this.loadedMetadataHandler);
    }
  }
  
  formatTime(time: number): string {
    if (!time || isNaN(time)) return '0:00';
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  }

  get progressPercent(): number {
    if (!this.duration || isNaN(this.duration)) return 0;
    return (this.currentTime / this.duration) * 100;
  }

  onSeek(event: Event) {
    const input = event.target as HTMLInputElement;
    const seekTime = parseFloat(input.value);
    this.playerService.audio.currentTime = seekTime;
    this.currentTime = seekTime;
  }



  togglePlay() {
    this.playerService.togglePlay();
  }

  nextSong() {
    this.playerService.nextSong();
  }

  previousSong() {
    this.playerService.previousSong();
  }

  toggleShuffle() {
    this.playerService.toggleShuffle();
  }

  toggleRepeat() {
    this.playerService.toggleRepeat();
  }

  onVolumeChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.volume = parseFloat(input.value);
    this.playerService.setVolume(this.volume);
    
    if (this.volume > 0) {
      this.previousVolume = this.volume;
    }
  }

  toggleMute() {
    if (this.volume > 0) {
      this.previousVolume = this.volume;
      this.volume = 0;
    } else {
      this.volume = this.previousVolume > 0 ? this.previousVolume : 1;
    }
    this.playerService.setVolume(this.volume);
  }

  toggleLike(song: any) {
    const currentlyLiked = this.isSongLiked(song);
    console.log(`%c[UI - Player Bar] Người dùng bấm nút ${currentlyLiked ? 'Bỏ thích' : 'Thích'} bài hát: "${song.title}" từ Thanh phát nhạc`, 'color: #f1c40f; font-weight: bold;');
    this.playlistService.toggleLikeSong(song).subscribe({
      next: () => {
        console.log(`%c[UI - Player Bar] Đã cập nhật trạng thái "Thích" thành công trên Thanh phát nhạc cho bài hát: "${song.title}"!`, 'color: #2ecc71; font-weight: bold;');
        this.cdr.detectChanges();
      }
    });
  }

  isSongLiked(song: any): boolean {
    return this.playlistService.isSongLiked(song);
  }
}
