import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, catchError } from 'rxjs';
import { MusicLibraryService } from './music-library.service';

export interface Song {
  id: number | string;
  title: string;
  artist: string;
  coverUrl: string;
  previewUrl: string;
  duration: string;
  plays: string;
  genre?: string;
  releaseDate?: string;
  copyright?: string;
  itunesId?: string;
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

  getSongDetail(id: string): Observable<Song | null> {
    if (!id) return of(null);
    const idStr = String(id);
    
    // Nếu là nhạc Local
    if (idStr.startsWith('s')) {
      const local = this.musicLibraryService.getSongById(idStr);
      if (local) {
        return of({
          id: local.id,
          title: local.title,
          artist: local.artistName,
          coverUrl: local.thumbnailUrl,
          previewUrl: local.fileUrl || local.previewUrl || '',
          duration: local.duration,
          plays: 'Local',
          genre: local.genreIds && local.genreIds.length > 0 ? 'Local Pop' : 'General'
        });
      }
    }
    
    // Nếu là UUID của bài hát trong Database Backend
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(idStr)) {
      return this.http.get<any>(`http://localhost:8080/api/songs/${idStr}`).pipe(
        map(song => {
          if (song) {
            const isItunes = song.source === 'ITUNES' || song.itunesId != null;
            return {
              id: song.songId,
              title: song.title,
              artist: song.artistName,
              coverUrl: song.thumbnailUrl || '',
              previewUrl: song.previewUrl || song.fileUrl || '',
              duration: isItunes ? '0:30' : this.formatDuration(song.duration * 1000),
              plays: 'DB',
              genre: 'Local',
              releaseDate: song.createdAt,
              itunesId: song.itunesId
            };
          }
          return null;
        }),
        catchError(() => of(null))
      );
    }
    
    // Nếu là nhạc iTunes
    const cleanId = idStr.replace('itunes-', '');
    return this.http.get<any>(`https://itunes.apple.com/lookup?id=${cleanId}`).pipe(
      map(res => {
        if (res.results && res.results.length > 0) {
          const item = res.results[0];
          return {
            id: `itunes-${item.trackId}`,
            title: item.trackName,
            artist: item.artistName,
            coverUrl: item.artworkUrl100 ? item.artworkUrl100.replace('100x100', '500x500') : '',
            previewUrl: item.previewUrl,
            duration: '0:30',
            plays: Math.floor(Math.random() * 900 + 100) + 'M',
            genre: item.primaryGenreName,
            releaseDate: item.releaseDate,
            copyright: item.copyright
          };
        }
        return null;
      }),
      catchError(() => of(null))
    );
  }

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
        duration: '0:30',
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
          duration: '0:30', // All iTunes songs show 0:30 due to preview constraint
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
