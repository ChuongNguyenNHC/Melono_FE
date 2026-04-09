import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface Song {
  id: number;
  title: string;
  artist: string;
  coverUrl: string;
  previewUrl: string;
  duration: string;
  plays: string;
}

@Injectable({
  providedIn: 'root'
})
export class MusicService {
  private http = inject(HttpClient);

  searchSongs(term: string, limit: number = 10): Observable<Song[]> {
    return this.http.get<any>(`https://itunes.apple.com/search?term=${term}&entity=song&limit=${limit}`).pipe(
      map(res => res.results.map((item: any) => ({
        id: item.trackId,
        title: item.trackName,
        artist: item.artistName,
        // Replace 100x100 with larger image size for better quality
        coverUrl: item.artworkUrl100 ? item.artworkUrl100.replace('100x100', '300x300') : '',
        previewUrl: item.previewUrl,
        duration: this.formatDuration(item.trackTimeMillis),
        plays: Math.floor(Math.random() * 900 + 100) + 'M' // Fake plays for demo
      })))
    );
  }

  private formatDuration(ms: number): string {
    if (!ms) return '0:00';
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return minutes + ":" + (parseInt(seconds) < 10 ? '0' : '') + seconds;
  }
}
