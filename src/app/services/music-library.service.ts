import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';

import {
  AppUser,
  ArtistRequest,
  CreateArtistRequestPayload,
  CreateLocalSongPayload,
  GenreCreatorType,
  CreatePlaylistPayload,
  LikedSong,
  ListenHistory,
  MusicGenre,
  MusicPlaylist,
  MusicSong,
  PlaylistFollow,
  PlaylistSong,
} from '../models/music-domain.models';

interface MusicLibraryState {
  users: AppUser[];
  songs: MusicSong[];
  genres: MusicGenre[];
  playlists: MusicPlaylist[];
  playlistSongs: PlaylistSong[];
  likedSongs: LikedSong[];
  playlistFollows: PlaylistFollow[];
  listenHistory: ListenHistory[];
  artistRequests: ArtistRequest[];
}

const STORAGE_KEY = 'melono_mock_library_v1';
const DEFAULT_USER_ID = 'u001';

const now = () => new Date().toISOString();

@Injectable({ providedIn: 'root' })
export class MusicLibraryService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/songs';

  private readonly stateSubject = new BehaviorSubject<MusicLibraryState>(this.loadInitialState());

  constructor() {
    this.fetchSongsFromBackend();
  }

  private fetchSongsFromBackend(): void {
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (songs) => {
        const mappedSongs: MusicSong[] = songs.map(song => this.mapBackendSongToFE(song));
        this.patchState(state => ({
          ...state,
          songs: mappedSongs
        }));
      },
      error: (err) => console.error('Failed to load songs from backend database', err)
    });
  }

  private mapBackendSongToFE(song: any): MusicSong {
    return {
      id: song.songId,
      title: song.title,
      artistName: song.artistName,
      source: song.source || 'LOCAL',
      genreIds: song.genreIds || [],
      itunesId: song.itunesId || undefined,
      previewUrl: song.previewUrl || undefined,
      fileUrl: song.fileUrl || undefined,
      thumbnailUrl: song.thumbnailUrl || 'https://via.placeholder.com/300x300?text=Melono',
      duration: song.duration || '--:--',
      status: song.status || 'PENDING',
      rejectReason: song.rejectReason || undefined,
      createdAt: song.createdAt || new Date().toISOString(),
      ownerUserId: song.ownerUserId || undefined,
      description: song.description || undefined,
      listenCount: song.listenCount || 0
    };
  }

  readonly users$ = this.stateSubject.pipe(map(state => state.users));
  readonly songs$ = this.stateSubject.pipe(map(state => state.songs));
  readonly genres$ = this.stateSubject.pipe(map(state => state.genres));
  readonly playlists$ = this.stateSubject.pipe(map(state => state.playlists));
  readonly artistRequests$ = this.stateSubject.pipe(map(state => state.artistRequests));

  readonly approvedSongs$ = this.songs$.pipe(
    map(songs => songs.filter(song => song.status === 'APPROVED'))
  );

  readonly currentUserLibrary$ = this.stateSubject.pipe(
    map(state => this.buildUserLibrary(state, this.currentUserId))
  );

  get currentUserId(): string {
    const storedUser = localStorage.getItem('mockUser');
    if (!storedUser) return DEFAULT_USER_ID;

    try {
      const user = JSON.parse(storedUser) as { id?: string };
      return user.id || DEFAULT_USER_ID;
    } catch {
      return DEFAULT_USER_ID;
    }
  }

  get snapshot(): MusicLibraryState {
    return this.stateSubject.value;
  }

  getSongById(songId: string): MusicSong | undefined {
    return this.snapshot.songs.find(song => song.id === songId);
  }

  getPlaylistById(playlistId: string): MusicPlaylist | undefined {
    return this.snapshot.playlists.find(playlist => playlist.id === playlistId);
  }

  getPlaylistSongs(playlistId: string): MusicSong[] {
    const songById = new Map(this.snapshot.songs.map(song => [song.id, song]));

    return this.snapshot.playlistSongs
      .filter(item => item.playlistId === playlistId)
      .map(item => songById.get(item.songId))
      .filter((song): song is MusicSong => Boolean(song));
  }

  searchApprovedSongs(keyword: string): MusicSong[] {
    const normalized = keyword.trim().toLowerCase();
    return this.snapshot.songs.filter(song => {
      if (song.status !== 'APPROVED') return false;
      if (!normalized) return true;
      return [song.title, song.artistName, song.description]
        .join(' ')
        .toLowerCase()
        .includes(normalized);
    });
  }

  getSongsByGenre(genreId: string): MusicSong[] {
    return this.snapshot.songs.filter(
      song => song.status === 'APPROVED' && song.genreIds.includes(genreId)
    );
  }

  createPlaylist(payload: CreatePlaylistPayload): void {
    this.patchState(state => ({
      ...state,
      playlists: [
        ...state.playlists,
        {
          id: this.createId('pl', state.playlists.length + 1),
          coverTheme: state.playlists.length % 5,
          createdAt: now(),
          ...payload,
        },
      ],
    }));
  }

  updatePlaylist(playlistId: string, patch: Partial<Pick<MusicPlaylist, 'name' | 'status' | 'coverTheme' | 'coverUrl'>>): void {
    this.patchState(state => ({
      ...state,
      playlists: state.playlists.map(playlist =>
        playlist.id === playlistId ? { ...playlist, ...patch } : playlist
      ),
    }));
  }

  deletePlaylist(playlistId: string): void {
    this.patchState(state => ({
      ...state,
      playlists: state.playlists.filter(playlist => playlist.id !== playlistId),
      playlistSongs: state.playlistSongs.filter(item => item.playlistId !== playlistId),
      playlistFollows: state.playlistFollows.filter(item => item.playlistId !== playlistId),
    }));
  }

  addSongToPlaylist(playlistId: string, songId: string): void {
    this.patchState(state => {
      const exists = state.playlistSongs.some(
        item => item.playlistId === playlistId && item.songId === songId
      );

      if (exists) return state;

      return {
        ...state,
        playlistSongs: [...state.playlistSongs, { playlistId, songId, addedAt: now() }],
      };
    });
  }

  removeSongFromPlaylist(playlistId: string, songId: string): void {
    this.patchState(state => ({
      ...state,
      playlistSongs: state.playlistSongs.filter(
        item => item.playlistId !== playlistId || item.songId !== songId
      ),
    }));
  }

  toggleLikeSong(userId: string, songId: string): void {
    this.patchState(state => {
      const exists = state.likedSongs.some(item => item.userId === userId && item.songId === songId);

      return {
        ...state,
        likedSongs: exists
          ? state.likedSongs.filter(item => item.userId !== userId || item.songId !== songId)
          : [...state.likedSongs, { userId, songId, createdAt: now() }],
      };
    });
  }

  followPlaylist(userId: string, playlistId: string): void {
    this.patchState(state => {
      const exists = state.playlistFollows.some(
        item => item.userId === userId && item.playlistId === playlistId
      );

      if (exists) return state;

      return {
        ...state,
        playlistFollows: [...state.playlistFollows, { userId, playlistId, createdAt: now() }],
      };
    });
  }

  recordListen(userId: string, songId: string): void {
    // 1. Cập nhật cục bộ state để UI phản hồi ngay lập tức và tăng listenCount của song
    this.patchState(state => {
      const updatedSongs = state.songs.map(song => {
        if (song.id === songId) {
          return {
            ...song,
            listenCount: (song.listenCount || 0) + 1
          };
        }
        return song;
      });

      return {
        ...state,
        songs: updatedSongs,
        listenHistory: [
          { userId, songId, listenedAt: now() },
          ...state.listenHistory.filter(item => item.userId !== userId || item.songId !== songId),
        ].slice(0, 50),
      };
    });

    // 2. Gửi request lên backend lưu lượt nghe vĩnh viễn trong MySQL
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(songId)) {
      this.http.post<void>(`${this.apiUrl}/${songId}/listen?userId=${userId}`, {}).subscribe({
        next: () => console.log(`Recorded play count on backend for song: ${songId}`),
        error: (err) => console.error('Failed to record play count on backend database', err)
      });
    }
  }

  submitArtistRequest(payload: CreateArtistRequestPayload): void {
    this.patchState(state => ({
      ...state,
      artistRequests: [
        {
          id: this.createId('ar', state.artistRequests.length + 1),
          status: 'PENDING',
          createdAt: now(),
          ...payload,
        },
        ...state.artistRequests,
      ],
    }));
  }

  approveArtistRequest(requestId: string): void {
    this.patchState(state => {
      const target = state.artistRequests.find(request => request.id === requestId);

      return {
        ...state,
        artistRequests: state.artistRequests.map(request =>
          request.id === requestId ? { ...request, status: 'APPROVED', rejectReason: '' } : request
        ),
        users: state.users.map(user =>
          user.id === target?.userId ? { ...user, role: 'ARTIST', status: 'ACTIVE' } : user
        ),
      };
    });
  }

  rejectArtistRequest(requestId: string, reason: string): void {
    this.patchState(state => ({
      ...state,
      artistRequests: state.artistRequests.map(request =>
        request.id === requestId
          ? { ...request, status: 'REJECTED', rejectReason: reason.trim() }
          : request
      ),
    }));
  }

  createLocalSong(payload: CreateLocalSongPayload): void {
    const body = {
      title: payload.title,
      artistName: payload.artistName,
      source: 'LOCAL',
      genreIds: payload.genreIds,
      duration: payload.duration,
      description: payload.description,
      thumbnailUrl: payload.thumbnailUrl,
      fileUrl: payload.fileUrl,
      ownerUserId: payload.ownerUserId,
      status: 'PENDING'
    };

    this.http.post<any>(this.apiUrl, body).subscribe({
      next: (savedSong) => {
        const mapped = this.mapBackendSongToFE(savedSong);
        this.patchState(state => ({
          ...state,
          songs: [mapped, ...state.songs]
        }));
      },
      error: (err) => console.error('Failed to create local song on backend', err)
    });
  }

  updateArtistSong(songId: string, ownerUserId: string, patch: Partial<CreateLocalSongPayload>): void {
    const body = {
      title: patch.title,
      artistName: patch.artistName,
      genreIds: patch.genreIds,
      duration: patch.duration,
      description: patch.description,
      thumbnailUrl: patch.thumbnailUrl,
      fileUrl: patch.fileUrl,
      ownerUserId: ownerUserId
    };

    this.http.put<any>(`${this.apiUrl}/${songId}`, body).subscribe({
      next: (updatedSong) => {
        const mapped = this.mapBackendSongToFE(updatedSong);
        this.patchState(state => ({
          ...state,
          songs: state.songs.map(song => song.id === songId ? mapped : song)
        }));
      },
      error: (err) => console.error('Failed to update artist song on backend', err)
    });
  }

  deleteArtistSong(songId: string, ownerUserId: string): void {
    this.http.delete<void>(`${this.apiUrl}/${songId}`).subscribe({
      next: () => {
        this.patchState(state => ({
          ...state,
          songs: state.songs.filter(song => song.id !== songId),
          playlistSongs: state.playlistSongs.filter(item => item.songId !== songId),
          likedSongs: state.likedSongs.filter(item => item.songId !== songId),
          listenHistory: state.listenHistory.filter(item => item.songId !== songId),
        }));
      },
      error: (err) => console.error('Failed to delete artist song on backend', err)
    });
  }

  saveItunesSong(song: {
    id: number | string;
    title: string;
    artist: string;
    coverUrl: string;
    previewUrl: string;
    duration: string;
    genreId?: string;
  }): string {
    const songId = `itunes-${song.id}`;
    const existingSong = this.snapshot.songs.find(item => item.id === songId);

    if (existingSong) {
      return existingSong.id;
    }

    const payload = {
      title: song.title,
      artistName: song.artist,
      source: 'ITUNES',
      genreIds: song.genreId ? [song.genreId] : [],
      itunesId: String(song.id),
      previewUrl: song.previewUrl,
      thumbnailUrl: song.coverUrl,
      duration: song.duration,
      status: 'APPROVED',
      description: 'Bài hát được lưu từ iTunes API.',
    };

    this.http.post<any>(this.apiUrl, payload).subscribe({
      next: (savedSong) => {
        const mapped = this.mapBackendSongToFE(savedSong);
        this.patchState(state => {
          const exists = state.songs.some(s => s.id === mapped.id);
          if (exists) return state;
          return {
            ...state,
            songs: [mapped, ...state.songs]
          };
        });
      },
      error: (err) => console.error('Failed to save iTunes song to backend', err)
    });

    // Vẫn lưu tạm vào local state đồng bộ để phát nhạc ngay lập tức
    this.patchState(state => ({
      ...state,
      songs: [
        {
          id: songId,
          title: song.title,
          artistName: song.artist,
          source: 'ITUNES',
          genreIds: song.genreId ? [song.genreId] : [],
          itunesId: String(song.id),
          previewUrl: song.previewUrl,
          thumbnailUrl: song.coverUrl,
          duration: song.duration,
          status: 'APPROVED',
          createdAt: now(),
          description: 'Bài hát được lưu từ iTunes API.',
        },
        ...state.songs,
      ],
    }));

    return songId;
  }

  approveSong(songId: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${songId}/status?status=APPROVED`, {}).pipe(
      tap((updatedSong) => {
        const mapped = this.mapBackendSongToFE(updatedSong);
        this.patchState(state => ({
          ...state,
          songs: state.songs.map(song => song.id === songId ? mapped : song)
        }));
      })
    );
  }

  rejectSong(songId: string, reason: string): Observable<any> {
    const encodedReason = encodeURIComponent(reason.trim());
    return this.http.put<any>(`${this.apiUrl}/${songId}/status?status=REJECTED&rejectReason=${encodedReason}`, {}).pipe(
      tap((updatedSong) => {
        const mapped = this.mapBackendSongToFE(updatedSong);
        this.patchState(state => ({
          ...state,
          songs: state.songs.map(song => song.id === songId ? mapped : song)
        }));
      })
    );
  }

  hideSong(songId: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${songId}/status?status=HIDDEN`, {}).pipe(
      tap((updatedSong) => {
        const mapped = this.mapBackendSongToFE(updatedSong);
        this.patchState(state => ({
          ...state,
          songs: state.songs.map(song => song.id === songId ? mapped : song)
        }));
      })
    );
  }

  restoreSong(songId: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${songId}/status?status=APPROVED`, {}).pipe(
      tap((updatedSong) => {
        const mapped = this.mapBackendSongToFE(updatedSong);
        this.patchState(state => ({
          ...state,
          songs: state.songs.map(song => song.id === songId ? mapped : song)
        }));
      })
    );
  }

  banUser(userId: string, reason: string): void {
    this.patchState(state => ({
      ...state,
      users: state.users.map(user =>
        user.id === userId && user.role !== 'ADMIN'
          ? { ...user, status: 'BANNED', banReason: reason.trim() }
          : user
      ),
    }));
  }

  unbanUser(userId: string): void {
    this.patchState(state => ({
      ...state,
      users: state.users.map(user =>
        user.id === userId ? { ...user, status: 'ACTIVE', banReason: '' } : user
      ),
    }));
  }

  createGenre(name: string, createdBy: GenreCreatorType = 'ADMIN', createdByUserId?: string): void {
    const normalized = name.trim();
    if (!normalized) return;

    this.patchState(state => ({
      ...state,
      genres: [
        ...state.genres,
        {
          id: this.createId('g', state.genres.length + 1),
          name: normalized,
          createdAt: now(),
          createdBy,
          createdByUserId,
        },
      ],
    }));
  }

  deleteArtistCreatedGenre(genreId: string): void {
    this.patchState(state => {
      const target = state.genres.find(genre => genre.id === genreId);

      if (!target || target.createdBy !== 'ARTIST_REQUEST') {
        return state;
      }

      return {
        ...state,
        genres: state.genres.filter(genre => genre.id !== genreId),
        songs: state.songs.map(song => ({
          ...song,
          genreIds: song.genreIds.filter(id => id !== genreId),
        })),
      };
    });
  }

  approveArtistCreatedGenre(genreId: string): void {
    this.patchState(state => ({
      ...state,
      genres: state.genres.map(genre =>
        genre.id === genreId && genre.createdBy === 'ARTIST_REQUEST'
          ? { ...genre, createdBy: 'ADMIN', createdByUserId: undefined }
          : genre
      ),
    }));
  }

  private updateSong(songId: string, patch: Partial<MusicSong>): void {
    this.patchState(state => ({
      ...state,
      songs: state.songs.map(song => (song.id === songId ? { ...song, ...patch } : song)),
    }));
  }

  private buildUserLibrary(state: MusicLibraryState, userId: string) {
    const songById = new Map(state.songs.map(song => [song.id, song]));
    const playlistById = new Map(state.playlists.map(playlist => [playlist.id, playlist]));

    return {
      playlists: state.playlists.filter(playlist => playlist.userId === userId),
      likedSongs: state.likedSongs
        .filter(item => item.userId === userId)
        .map(item => songById.get(item.songId))
        .filter((song): song is MusicSong => Boolean(song)),
      followedPlaylists: state.playlistFollows
        .filter(item => item.userId === userId)
        .map(item => playlistById.get(item.playlistId))
        .filter((playlist): playlist is MusicPlaylist => Boolean(playlist)),
      listenHistory: state.listenHistory
        .filter(item => item.userId === userId)
        .map(item => songById.get(item.songId))
        .filter((song): song is MusicSong => Boolean(song)),
    };
  }

  private patchState(project: (state: MusicLibraryState) => MusicLibraryState): void {
    const nextState = project(this.snapshot);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    this.stateSubject.next(nextState);
  }

  private loadInitialState(): MusicLibraryState {
    const storedState = localStorage.getItem(STORAGE_KEY);
    if (storedState) {
      return this.normalizeMockState(JSON.parse(storedState) as MusicLibraryState);
    }

    return this.normalizeMockState(createSeedState());
  }

  private createId(prefix: string, next: number): string {
    return `${prefix}${String(next).padStart(3, '0')}`;
  }

  private normalizeMockState(state: MusicLibraryState): MusicLibraryState {
    const unwantedSongIds = ['s001', 's002', 's003', 'itunes-6768878796'];

    // Filter out the unwanted mock songs
    let songs = (state.songs || []).filter(song => !unwantedSongIds.includes(song.id));
    const playlistSongs = (state.playlistSongs || []).filter(item => !unwantedSongIds.includes(item.songId));
    const likedSongs = (state.likedSongs || []).filter(item => !unwantedSongIds.includes(item.songId));
    const listenHistory = (state.listenHistory || []).filter(item => !unwantedSongIds.includes(item.songId));

    const hasArtistApprovedSong = songs.some(
      song => song.ownerUserId === 'u002' && song.status === 'APPROVED'
    );

    if (!hasArtistApprovedSong) {
      songs = [
        ...songs,
        {
          id: 's900',
          title: 'Nắng trong veo',
          artistName: 'Trần Minh',
          source: 'LOCAL',
          genreIds: ['g001'],
          fileUrl: 'assets/audio/demo-song.mp3',
          thumbnailUrl:
            'https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=300&auto=format&fit=crop',
          duration: '03:32',
          status: 'APPROVED',
          createdAt: '2026-05-01T09:00:00.000Z',
          ownerUserId: 'u002',
          description: 'Một bản pop nhẹ nhàng do nghệ sĩ mô tả để giới thiệu cảm xúc của bài hát.',
        },
      ];
    }

    const nextState = {
      ...state,
      songs,
      playlistSongs,
      likedSongs,
      listenHistory
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));

    return nextState;
  }
}

function createSeedState(): MusicLibraryState {
  const users: AppUser[] = [
    {
      id: 'u001',
      name: 'Nguyễn Hoàng',
      email: 'hoang@example.com',
      role: 'USER',
      avatarUrl: 'https://i.pravatar.cc/100?img=1',
      status: 'ACTIVE',
      createdAt: '2026-03-01T08:00:00.000Z',
    },
    {
      id: 'u002',
      name: 'Trần Minh',
      email: 'minh@example.com',
      role: 'ARTIST',
      avatarUrl: 'https://i.pravatar.cc/100?img=2',
      status: 'ACTIVE',
      createdAt: '2026-03-12T08:00:00.000Z',
    },
    {
      id: 'u003',
      name: 'Quản trị viên',
      email: 'admin@melono.local',
      role: 'ADMIN',
      avatarUrl: 'https://ui-avatars.com/api/?name=Admin&background=1ed760&color=fff',
      status: 'ACTIVE',
      createdAt: '2026-02-01T08:00:00.000Z',
    },
  ];

  const genres: MusicGenre[] = [
    { id: 'g001', name: 'Pop', createdAt: '2026-03-01T08:00:00.000Z', createdBy: 'ADMIN' },
    { id: 'g002', name: 'Acoustic', createdAt: '2026-03-01T08:00:00.000Z', createdBy: 'ADMIN' },
    { id: 'g003', name: 'Rap', createdAt: '2026-03-01T08:00:00.000Z', createdBy: 'ADMIN' },
    { id: 'g004', name: 'Ballad', createdAt: '2026-03-01T08:00:00.000Z', createdBy: 'ADMIN' },
  ];

  const songs: MusicSong[] = [];

  const playlists: MusicPlaylist[] = [
    { id: 'pl001', userId: 'u001', name: 'Nhạc Chilling', status: 'PUBLIC', coverTheme: 0, createdAt: '2026-04-01T08:00:00.000Z' },
    { id: 'pl002', userId: 'u001', name: 'Top Hits Việt Nam', status: 'PRIVATE', coverTheme: 1, createdAt: '2026-04-02T08:00:00.000Z' },
  ];

  return {
    users,
    songs,
    genres,
    playlists,
    playlistSongs: [],
    likedSongs: [],
    playlistFollows: [],
    listenHistory: [],
    artistRequests: [
      {
        id: 'ar001',
        userId: 'u001',
        stageName: 'Hoàng Acoustic',
        genre: 'Acoustic',
        bio: 'Ca sĩ tự do theo đuổi dòng nhạc acoustic và indie.',
        status: 'PENDING',
        createdAt: '2026-04-09T08:00:00.000Z',
      },
    ],
  };
}
