import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Footer } from '../footer/footer';
import { MusicService, Song } from '../services/music.service';
import { PlayerService } from '../services/player.service';
import { PlaylistService, Playlist } from '../services/playlist.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, Footer, RouterModule],
  templateUrl: './search.html',
  styleUrl: './search.css'
})
export class Search implements OnInit {
  route = inject(ActivatedRoute);
  musicService = inject(MusicService);
  playerService = inject(PlayerService);
  playlistService = inject(PlaylistService);
  cdr = inject(ChangeDetectorRef);

  query: string = '';
  songs: Song[] = [];
  playlists: Playlist[] = [];
  topResult: any = null;
  topResultType: 'song' | 'playlist' | null = null;
  isLoading = false;

  private calculateMatchScore(name: string, query: string, isPlaylist: boolean = false): number {
    if (!name || !query) return 0;
    const n = name.toLowerCase().trim();
    const q = query.toLowerCase().trim();
    
    let score = 0;
    
    // 1. So khớp tuyệt đối
    if (n === q) {
      score = 100;
    }
    // 2. So khớp bắt đầu bằng
    else if (n.startsWith(q)) {
      score = 85;
    }
    // 3. So khớp chứa chuỗi
    else if (n.includes(q)) {
      score = 60;
    }
    // 4. So khớp theo từ tố (Token-based) để hỗ trợ tìm kiếm không theo thứ tự từ
    else {
      const queryWords = q.split(/\s+/);
      const nameWords = n.split(/\s+/);
      let matchedWordsCount = 0;
      
      for (const qw of queryWords) {
        if (nameWords.some(nw => nw.includes(qw) || qw.includes(nw))) {
          matchedWordsCount++;
        }
      }
      
      if (matchedWordsCount > 0) {
        score = Math.round((matchedWordsCount / queryWords.length) * 45);
      }
    }

    // 5. Keyword Intent Recognition (Phát hiện ý đồ tìm kiếm Playlist của người dùng)
    if (isPlaylist) {
      const playlistKeywords = ['playlist', 'list', 'danh sách', 'album', 'tuyển tập', 'tập hợp', 'nghe tuyển', 'danh sach', 'tuyen tap', 'danh sách phát', 'danh sach phat'];
      const hasPlaylistKeyword = playlistKeywords.some(keyword => q.includes(keyword));
      
      if (hasPlaylistKeyword) {
        // Kiểm tra xem query có phải chỉ là từ khóa chỉ định playlist thuần túy hay không
        const isPureIntent = playlistKeywords.some(keyword => q === keyword);
        if (isPureIntent) {
          score = 120; // Đặt 120 điểm (vượt qua 100 điểm tuyệt đối của bài hát có tên trùng) để đưa Playlist làm Kết quả hàng đầu
        } else {
          score += 45; // Boost cực mạnh nếu người dùng gõ từ khóa muốn tìm playlist kèm từ khóa phụ
        }
      } else {
        score += 15; // Mặc định boost nhẹ 15 điểm để ưu tiên playlist khi trùng khớp tốt
      }
    }

    return score;
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.query = params['q'] || '';
      if (this.query) {
        this.performSearch();
      } else {
        this.songs = [];
        this.playlists = [];
        this.topResult = null;
        this.topResultType = null;
        this.cdr.detectChanges();
      }
    });
  }

  performSearch() {
    this.isLoading = true;
    this.cdr.detectChanges();

    let songsLoaded = false;
    let playlistsLoaded = false;

    const checkFinished = () => {
      if (songsLoaded && playlistsLoaded) {
        this.isLoading = false;
        
        // Giải thuật chọn Top Result thông minh
        const topSong = this.songs.length > 0 ? this.songs[0] : null;
        const topPlaylist = this.playlists.length > 0 ? this.playlists[0] : null;

        if (topSong && topPlaylist) {
          const songScore = this.calculateMatchScore(topSong.title, this.query, false);
          const playlistScore = this.calculateMatchScore(topPlaylist.name, this.query, true);

          if (playlistScore >= songScore) {
            this.topResult = topPlaylist;
            this.topResultType = 'playlist';
          } else {
            this.topResult = topSong;
            this.topResultType = 'song';
          }
        } else if (topPlaylist) {
          this.topResult = topPlaylist;
          this.topResultType = 'playlist';
        } else if (topSong) {
          this.topResult = topSong;
          this.topResultType = 'song';
        } else {
          this.topResult = null;
          this.topResultType = null;
        }

        this.cdr.detectChanges();
      }
    };

    this.musicService.searchSongs(this.query, 30).subscribe({
      next: (data) => {
        this.songs = data;
        songsLoaded = true;
        checkFinished();
      },
      error: (e) => {
        console.error(e);
        songsLoaded = true;
        checkFinished();
      }
    });

    this.playlistService.searchPublicPlaylists(this.query).subscribe({
      next: (data) => {
        this.playlists = data;
        playlistsLoaded = true;
        checkFinished();
      },
      error: (e) => {
        console.error(e);
        playlistsLoaded = true;
        checkFinished();
      }
    });
  }

  playSong(song: Song) {
    this.playerService.playSong(song, this.songs);
  }
}
