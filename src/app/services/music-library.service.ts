import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';

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
  private readonly stateSubject = new BehaviorSubject<MusicLibraryState>(this.loadInitialState());

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
    this.patchState(state => ({
      ...state,
      listenHistory: [
        { userId, songId, listenedAt: now() },
        ...state.listenHistory.filter(item => item.userId !== userId || item.songId !== songId),
      ].slice(0, 50),
    }));
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
    this.patchState(state => ({
      ...state,
      songs: [
        {
          id: this.createId('s', state.songs.length + 1),
          source: 'LOCAL',
          status: 'PENDING',
          createdAt: now(),
          ...payload,
        },
        ...state.songs,
      ],
    }));
  }

  updateArtistSong(songId: string, ownerUserId: string, patch: Partial<CreateLocalSongPayload>): void {
    this.patchState(state => ({
      ...state,
      songs: state.songs.map(song => {
        if (song.id !== songId || song.ownerUserId !== ownerUserId || song.source !== 'LOCAL') {
          return song;
        }

        return {
          ...song,
          ...patch,
          status: song.status === 'REJECTED' ? 'PENDING' : song.status,
          rejectReason: song.status === 'REJECTED' ? '' : song.rejectReason,
        };
      }),
    }));
  }

  deleteArtistSong(songId: string, ownerUserId: string): void {
    this.patchState(state => ({
      ...state,
      songs: state.songs.filter(song => song.id !== songId || song.ownerUserId !== ownerUserId),
      playlistSongs: state.playlistSongs.filter(item => item.songId !== songId),
      likedSongs: state.likedSongs.filter(item => item.songId !== songId),
      listenHistory: state.listenHistory.filter(item => item.songId !== songId),
    }));
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

  approveSong(songId: string): void {
    this.updateSong(songId, { status: 'APPROVED', rejectReason: '' });
  }

  rejectSong(songId: string, reason: string): void {
    this.updateSong(songId, { status: 'REJECTED', rejectReason: reason.trim() });
  }

  hideSong(songId: string): void {
    this.updateSong(songId, { status: 'HIDDEN' });
  }

  restoreSong(songId: string): void {
    this.updateSong(songId, { status: 'APPROVED' });
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
    let songs = state.songs.map(song => {
      if (song.id === 's001') {
        return {
          ...song,
          description:
            song.description === 'Bài hát acoustic đang chờ kiểm duyệt.'
              ? 'Bài hát acoustic với màu sắc thành phố về đêm và nhịp guitar mộc.'
              : song.description,
        };
      }

      if (song.id === 's002') {
        return {
          ...song,
          ownerUserId: song.ownerUserId || 'u002',
          description:
            song.description === 'Bài hát đã được duyệt để hiển thị cho người dùng.'
              ? 'Ca khúc pop tươi sáng với phần phối khí trẻ trung và giai điệu dễ nghe.'
              : song.description,
        };
      }

      if (song.id === 's003') {
        return {
          ...song,
          description:
            song.description === 'Bài hát bị từ chối và cần nghệ sĩ chỉnh sửa.'
              ? 'Bản ballad nhẹ nhàng kể về những cảm xúc còn vương sau một cuộc gặp.'
              : song.description,
        };
      }

      return song;
    });

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

    const likedSongs = [
      ...state.likedSongs,
      ...(['u001', 'u003'] as const)
        .filter(userId => !state.likedSongs.some(item => item.userId === userId && item.songId === 's002'))
        .map(userId => ({ userId, songId: 's002', createdAt: now() })),
    ];

    const listenHistory = [
      ...state.listenHistory,
      ...(['u001', 'u002', 'u003'] as const)
        .filter(userId => !state.listenHistory.some(item => item.userId === userId && item.songId === 's002'))
        .map(userId => ({ userId, songId: 's002', listenedAt: now() })),
    ];

    const nextState = { ...state, songs, likedSongs, listenHistory };
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

  const songs: MusicSong[] = [
    {
      id: 's001',
      title: 'Đêm thành phố',
      artistName: 'Dưa lưới',
      source: 'LOCAL',
      genreIds: ['g002'],
      fileUrl: 'assets/audio/demo-song.mp3',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=300&auto=format&fit=crop',
      duration: '04:05',
      status: 'PENDING',
      createdAt: '2026-04-10T08:30:00.000Z',
      ownerUserId: 'u002',
      description: 'Bài hát acoustic với màu sắc thành phố về đêm và nhịp guitar mộc.',
    },
    {
      id: 's002',
      title: 'Giai điệu mơ',
      artistName: 'Khánh Beat',
      source: 'ITUNES',
      genreIds: ['g001'],
      itunesId: '1002',
      previewUrl: 'assets/audio/demo-song.mp3',
      ownerUserId: 'u002',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=300&auto=format&fit=crop',
      duration: '0:30',
      status: 'APPROVED',
      createdAt: '2026-04-09T18:10:00.000Z',
      description: 'Ca khúc pop tươi sáng với phần phối khí trẻ trung và giai điệu dễ nghe.',
    },
    {
      id: 's003',
      title: 'Ly trà xanh',
      artistName: 'Hồng Nhung',
      source: 'LOCAL',
      genreIds: ['g004'],
      fileUrl: 'assets/audio/demo-song.mp3',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=300&auto=format&fit=crop',
      duration: '03:45',
      status: 'REJECTED',
      rejectReason: 'Chất lượng file audio chưa đạt yêu cầu.',
      createdAt: '2026-04-08T12:00:00.000Z',
      ownerUserId: 'u002',
      description: 'Bản ballad nhẹ nhàng kể về những cảm xúc còn vương sau một cuộc gặp.',
    },
  ];

  const playlists: MusicPlaylist[] = [
    { id: 'pl001', userId: 'u001', name: 'Nhạc Chilling', status: 'PUBLIC', coverTheme: 0, createdAt: '2026-04-01T08:00:00.000Z' },
    { id: 'pl002', userId: 'u001', name: 'Top Hits Việt Nam', status: 'PRIVATE', coverTheme: 1, createdAt: '2026-04-02T08:00:00.000Z' },
  ];

  return {
    users,
    songs,
    genres,
    playlists,
    playlistSongs: [
      { playlistId: 'pl001', songId: 's002', addedAt: '2026-04-04T08:00:00.000Z' },
    ],
    likedSongs: [
      { userId: 'u001', songId: 's002', createdAt: '2026-04-05T08:00:00.000Z' },
      { userId: 'u003', songId: 's002', createdAt: '2026-04-07T08:00:00.000Z' },
    ],
    playlistFollows: [],
    listenHistory: [
      { userId: 'u001', songId: 's002', listenedAt: '2026-04-06T08:00:00.000Z' },
      { userId: 'u002', songId: 's002', listenedAt: '2026-04-07T08:00:00.000Z' },
      { userId: 'u003', songId: 's002', listenedAt: '2026-04-08T08:00:00.000Z' },
    ],
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
