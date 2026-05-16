import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { MusicLibraryService } from './music-library.service';

export interface Song {
  id: number | string;
  title: string;
  artist: string;
  coverUrl: string;
  previewUrl: string;
  duration: string;
  plays: string;
}

export interface ItunesPlaylist {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  description: string;
  query: string;
}

@Injectable({
  providedIn: 'root'
})
export class MusicService {
  private http = inject(HttpClient);
  private musicLibraryService = inject(MusicLibraryService);

  searchSongs(term: string, limit: number = 10): Observable<Song[]> {
    return this.searchItunesSongs(term, limit).pipe(
      map(itunesSongs => {
        const localSongs = this.musicLibraryService.searchApprovedSongs(term).map(song => ({
          id: song.id,
          title: song.title,
          artist: song.artistName,
          coverUrl: song.thumbnailUrl,
          previewUrl: song.fileUrl || song.previewUrl || '',
          duration: song.duration,
          plays: 'Local',
        }));

        return [...localSongs, ...itunesSongs].slice(0, limit);
      })
    );
  }

  searchItunesSongs(term: string, limit: number = 10): Observable<Song[]> {
    return this.http.get<any>(`https://itunes.apple.com/search?term=${term}&entity=song&limit=${limit}`).pipe(
      map(res => res.results.map((item: any) => ({
        id: item.trackId,
        title: item.trackName,
        artist: item.artistName,
        coverUrl: item.artworkUrl100 ? item.artworkUrl100.replace('100x100', '300x300') : '',
        previewUrl: item.previewUrl,
        duration: this.formatDuration(item.trackTimeMillis),
        plays: Math.floor(Math.random() * 900 + 100) + 'M',
      })))
    );
  }

  fetchChart(country: string = 'vn', limit: number = 10): Observable<Song[]> {
    return this.http.get<any>(`https://itunes.apple.com/${country}/rss/topsongs/limit=${limit}/json`).pipe(
      map(res => {
        const entries = res.feed.entry || [];
        return entries.map((item: any) => ({
          id: parseInt(item.id.attributes['im:id'] || '0'),
          title: item['title'].label.split(' - ')[0] || item['im:name'].label,
          artist: item['im:artist'].label,
          coverUrl: item['im:image'] && item['im:image'].length > 0 ? item['im:image'][item['im:image'].length - 1].label.replace(/170x170|60x60|55x55/, '300x300') : '',
          previewUrl: item.link && item.link.length > 1 && item.link[1].attributes ? item.link[1].attributes.href : '',
          duration: '3:30', // Fake duration since RSS lacks trackTimeMillis 
          plays: Math.floor(Math.random() * 90) + 10 + 'M' // Fake plays
        }));
      })
    );
  }

  fetchTopAlbums(country: string = 'vn', limit: number = 10): Observable<ItunesPlaylist[]> {
    return this.http.get<any>(`https://itunes.apple.com/${country}/rss/topalbums/limit=${limit}/json`).pipe(
      map(res => {
        const entries = res.feed.entry || [];
        return entries.map((item: any, index: number) => {
          const title = item['im:name']?.label || item.title?.label || `iTunes Playlist ${index + 1}`;
          const artist = item['im:artist']?.label || 'iTunes';
          const coverUrl = item['im:image'] && item['im:image'].length > 0
            ? item['im:image'][item['im:image'].length - 1].label.replace(/170x170|100x100|60x60|55x55/, '300x300')
            : '';

          return {
            id: `itunes-${item.id?.attributes?.['im:id'] || index + 1}`,
            title,
            artist,
            coverUrl,
            description: `${artist} • tuyển tập từ iTunes`,
            query: `${title} ${artist}`,
          };
        });
      })
    );
  }

  getTopArtists(term: string, limit: number = 6): Observable<any[]> {
    return this.searchSongs(term, 30).pipe(
      map(songs => {
        const uniqueArtists = new Map<string, any>();
        for (const song of songs) {
          if (!uniqueArtists.has(song.artist)) {
            uniqueArtists.set(song.artist, {
              id: song.id,
              name: song.artist,
              imageUrl: song.coverUrl
            });
          }
        }
        return Array.from(uniqueArtists.values()).slice(0, limit);
      })
    );
  }

  private formatDuration(ms: number): string {
    if (!ms) return '0:00';
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return minutes + ":" + (parseInt(seconds) < 10 ? '0' : '') + seconds;
  }
}
