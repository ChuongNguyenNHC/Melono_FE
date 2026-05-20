import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Song } from './music.service';

export interface Playlist {
  playlistId?: string;
  userId: string;
  name: string;
  status: 'PUBLIC' | 'PRIVATE';
  createdAt?: string;
  coverUrl?: string;
  songCount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PlaylistService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = 'http://localhost:8080/api/playlists';

  private playlistsSubject = new BehaviorSubject<Playlist[]>([]);
  playlists$ = this.playlistsSubject.asObservable();

  private likedSongsSubject = new BehaviorSubject<Song[]>([]);
  likedSongs$ = this.likedSongsSubject.asObservable();

  private followedPlaylistsSubject = new BehaviorSubject<Playlist[]>([]);
  followedPlaylists$ = this.followedPlaylistsSubject.asObservable();

  getUserPlaylists(): Observable<Playlist[]> {
    const user = this.authService.currentUserValue;
    if (!user) return of([]);
    return this.http.get<Playlist[]>(`${this.apiUrl}/user/${user.id}`).pipe(
      tap(playlists => this.playlistsSubject.next(playlists))
    );
  }

  createPlaylist(name: string, status: 'PUBLIC' | 'PRIVATE' = 'PUBLIC'): Observable<Playlist> {
    const user = this.authService.currentUserValue;
    if (!user) throw new Error('User not logged in');
    return this.http.post<Playlist>(this.apiUrl, {
      userId: user.id,
      name: name,
      status: status
    }).pipe(
      tap(() => this.getUserPlaylists().subscribe())
    );
  }

  getPlaylistById(playlistId: string): Observable<Playlist> {
    return this.http.get<Playlist>(`${this.apiUrl}/${playlistId}`);
  }

  getPlaylistSongs(playlistId: string): Observable<Song[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${playlistId}/songs`).pipe(
      map(songs => songs.map(s => {
        const isItunes = s.source === 'ITUNES' || s.itunesId != null;
        return {
          id: s.songId, // Sử dụng ID bài hát để tương tác
          title: s.title,
          artist: s.artistName,
          coverUrl: s.thumbnailUrl,
          previewUrl: s.previewUrl || s.fileUrl || '',
          duration: isItunes ? '0:30' : this.formatDuration(s.duration),
          plays: '0',
          itunesId: s.itunesId
        };
      }))
    );
  }

  addSongToPlaylist(playlistId: string, song: Song): Observable<any> {
    const isItunes = String(song.id).startsWith('itunes-') || typeof song.id === 'number' || !isNaN(Number(song.id));
    const itunesId = isItunes ? String(song.id).replace('itunes-', '') : null;

    const songPayload = {
      title: song.title,
      artistName: song.artist,
      source: isItunes ? 'ITUNES' : 'LOCAL',
      itunesId: itunesId,
      previewUrl: song.previewUrl,
      thumbnailUrl: song.coverUrl,
      duration: this.parseDuration(song.duration)
    };

    return this.http.post<any>('http://localhost:8080/api/songs', songPayload).pipe(
      switchMap(savedSong => {
        const songUuid = savedSong.songId;
        return this.http.post(`${this.apiUrl}/${playlistId}/songs/${songUuid}`, {}, { responseType: 'text' as 'json' });
      }),
      tap(() => this.getUserPlaylists().subscribe())
    );
  }

  removeSongFromPlaylist(playlistId: string, songId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${playlistId}/songs/${songId}`, { responseType: 'text' as 'json' }).pipe(
      tap(() => this.getUserPlaylists().subscribe())
    );
  }

  deletePlaylist(playlistId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${playlistId}`, { responseType: 'text' as 'json' }).pipe(
      tap(() => this.getUserPlaylists().subscribe())
    );
  }

  updatePlaylist(playlistId: string, name: string, status: 'PUBLIC' | 'PRIVATE'): Observable<Playlist> {
    return this.http.put<Playlist>(`${this.apiUrl}/${playlistId}`, {
      name: name,
      status: status
    }).pipe(
      tap(() => this.getUserPlaylists().subscribe())
    );
  }

  getLikedSongs(): Observable<Song[]> {
    const user = this.authService.currentUserValue;
    if (!user) return of([]);
    
    console.log(`%c[API] Đang gọi GET danh sách bài hát yêu thích cho User ID: ${user.id}...`, 'color: #9b59b6; font-weight: bold;');
    
    return this.http.get<any[]>(`http://localhost:8080/api/songs/liked?userId=${user.id}`).pipe(
      map(songs => songs.map(s => {
        const isItunes = s.source === 'ITUNES' || s.itunesId != null;
        return {
          id: s.songId,
          title: s.title,
          artist: s.artistName,
          coverUrl: s.thumbnailUrl || '',
          previewUrl: s.previewUrl || s.fileUrl || '',
          duration: isItunes ? '0:30' : this.formatDuration(s.duration),
          plays: '0',
          itunesId: s.itunesId
        };
      })),
      tap(songs => {
        console.log(`%c[API] Đã tải về ${songs.length} bài hát yêu thích thành công!`, 'color: #2ecc71; font-weight: bold;', songs);
        this.likedSongsSubject.next(songs);
      })
    );
  }

  toggleLikeSong(song: Song): Observable<any> {
    const user = this.authService.currentUserValue;
    if (!user) throw new Error('User not logged in');

    const likedList = this.likedSongsSubject.value;
    
    // 1. Xác định itunesId của bài hát truyền vào (nếu có)
    let itunesId: string | null = null;
    if (song.itunesId) {
      itunesId = String(song.itunesId);
    } else {
      const idStr = String(song.id);
      const isItunesFormat = idStr.startsWith('itunes-') || !isNaN(Number(idStr)) && !idStr.startsWith('s') && !idStr.includes('-');
      if (isItunesFormat) {
        itunesId = idStr.replace('itunes-', '');
      }
    }

    const isItunes = itunesId !== null;

    // 2. Tìm kiếm thông minh bài hát trong danh sách đã thích
    let existingLikedSong: any = null;
    if (itunesId) {
      existingLikedSong = likedList.find(s => {
        const sItunesId = s.itunesId ? String(s.itunesId) : (String(s.id).startsWith('itunes-') ? String(s.id).replace('itunes-', '') : null);
        return sItunesId === itunesId;
      });
    }

    if (!existingLikedSong) {
      const songIdStr = String(song.id).replace('itunes-', '');
      existingLikedSong = likedList.find(s => {
        const sIdStr = String(s.id).replace('itunes-', '');
        return sIdStr === songIdStr;
      });
    }

    if (existingLikedSong) {
      const songUuid = existingLikedSong.id;
      const unlikeUrl = `http://localhost:8080/api/songs/${songUuid}/unlike?userId=${user.id}`;
      console.log(`%c[API - Unlike] Bắt đầu gỡ thích bài hát.`, 'color: #e74c3c; font-weight: bold;');
      console.log(`%c[API - Unlike] Request: POST ${unlikeUrl}`, 'color: #e67e22;', {
        songId: song.id,
        songUuid: songUuid,
        title: song.title,
        userId: user.id
      });

      return this.http.post(unlikeUrl, {}).pipe(
        tap(() => {
          console.log(`%c[API - Unlike] Response thành công! Đã bỏ thích bài hát "${song.title}" (UUID: ${songUuid})`, 'color: #2ecc71; font-weight: bold;');
        }),
        switchMap(() => this.getLikedSongs()) // Chờ danh sách yêu thích tải xong rồi mới phát tín hiệu hoàn thành
      );
    } else {
      const songPayload = {
        title: song.title,
        artistName: song.artist,
        source: isItunes ? 'ITUNES' : 'LOCAL',
        itunesId: itunesId,
        previewUrl: song.previewUrl,
        thumbnailUrl: song.coverUrl,
        duration: this.parseDuration(song.duration)
      };

      console.log(`%c[API - Like] Bắt đầu thích bài hát mới/iTunes.`, 'color: #3498db; font-weight: bold;');
      console.log(`%c[API - Like] Step 1: Tạo/đăng ký thông tin bài hát. Request: POST http://localhost:8080/api/songs`, 'color: #34495e;', songPayload);

      return this.http.post<any>('http://localhost:8080/api/songs', songPayload).pipe(
        switchMap(savedSong => {
          const songUuid = savedSong.songId;
          const likeUrl = `http://localhost:8080/api/songs/${songUuid}/like?userId=${user.id}`;
          console.log(`%c[API - Like] Response Step 1 thành công! Bài hát đã được đăng ký trên DB với UUID: ${songUuid}`, 'color: #2ecc71;', savedSong);
          console.log(`%c[API - Like] Step 2: Thích bài hát với UUID này. Request: POST ${likeUrl}`, 'color: #34495e;');
          return this.http.post(likeUrl, {}).pipe(
            map(() => savedSong)
          );
        }),
        tap(savedSong => {
          console.log(`%c[API - Like] Response Step 2 thành công! Đã thích bài hát "${song.title}" (UUID: ${savedSong.songId})`, 'color: #2ecc71; font-weight: bold;');
        }),
        switchMap(savedSong => this.getLikedSongs().pipe(map(() => savedSong))) // Chờ danh sách yêu thích tải xong rồi mới phát tín hiệu hoàn thành
      );
    }
  }

  isSongLiked(song: Song): boolean {
    if (!song) return false;
    const likedList = this.likedSongsSubject.value;
    
    // 1. Xác định itunesId của bài hát truyền vào
    let itunesId: string | null = null;
    if (song.itunesId) {
      itunesId = String(song.itunesId);
    } else {
      const idStr = String(song.id);
      const isItunesFormat = idStr.startsWith('itunes-') || !isNaN(Number(idStr)) && !idStr.startsWith('s') && !idStr.includes('-');
      if (isItunesFormat) {
        itunesId = idStr.replace('itunes-', '');
      }
    }

    // 2. Nếu là bài hát iTunes, so khớp theo itunesId trước (bất kể kiểu dữ liệu là string hay number)
    if (itunesId) {
      const match = likedList.some(s => {
        const sItunesId = s.itunesId ? String(s.itunesId) : (String(s.id).startsWith('itunes-') ? String(s.id).replace('itunes-', '') : null);
        return sItunesId === itunesId;
      });
      if (match) return true;
    }

    // 3. So khớp theo ID thô (UUID hoặc Mock ID)
    const songIdStr = String(song.id).replace('itunes-', '');
    return likedList.some(s => {
      const sIdStr = String(s.id).replace('itunes-', '');
      return sIdStr === songIdStr;
    });
  }

  getFollowedPlaylists(): Observable<Playlist[]> {
    const user = this.authService.currentUserValue;
    if (!user) return of([]);
    return this.http.get<Playlist[]>(`${this.apiUrl}/followed?userId=${user.id}`).pipe(
      tap(playlists => this.followedPlaylistsSubject.next(playlists))
    );
  }

  followPlaylist(playlistId: string): Observable<Playlist[]> {
    const user = this.authService.currentUserValue;
    if (!user) throw new Error('User not logged in');
    return this.http.post(`${this.apiUrl}/${playlistId}/follow?userId=${user.id}`, {}, { responseType: 'text' as 'json' }).pipe(
      switchMap(() => this.getFollowedPlaylists())
    );
  }

  unfollowPlaylist(playlistId: string): Observable<Playlist[]> {
    const user = this.authService.currentUserValue;
    if (!user) throw new Error('User not logged in');
    return this.http.post(`${this.apiUrl}/${playlistId}/unfollow?userId=${user.id}`, {}, { responseType: 'text' as 'json' }).pipe(
      switchMap(() => this.getFollowedPlaylists())
    );
  }

  searchPublicPlaylists(query: string): Observable<Playlist[]> {
    return this.http.get<Playlist[]>(`${this.apiUrl}/search/public?q=${encodeURIComponent(query)}`);
  }

  isPlaylistFollowed(playlistId: string): boolean {
    const list = this.followedPlaylistsSubject.value;
    return list.some(p => String(p.playlistId) === String(playlistId));
  }

  private parseDuration(duration: string): number {
    if (!duration) return 180;
    const parts = duration.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    }
    return parseInt(duration, 10) || 180;
  }

  private formatDuration(seconds: number): string {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  }
}
