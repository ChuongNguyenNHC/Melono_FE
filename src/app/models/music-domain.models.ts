export type UserRole = 'USER' | 'ARTIST' | 'ADMIN';
export type AccountStatus = 'ACTIVE' | 'BANNED';
export type SongSource = 'LOCAL' | 'ITUNES';
export type SongStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'HIDDEN';
export type PlaylistStatus = 'PUBLIC' | 'PRIVATE';
export type ArtistRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type GenreCreatorType = 'ADMIN' | 'ARTIST_REQUEST';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  role: UserRole;
  avatarUrl: string;
  status: AccountStatus;
  banReason?: string;
  createdAt: string;
}

export interface MusicSong {
  id: string;
  title: string;
  artistName: string;
  source: SongSource;
  genreIds: string[];
  itunesId?: string;
  previewUrl?: string;
  fileUrl?: string;
  thumbnailUrl: string;
  duration: string;
  status: SongStatus;
  rejectReason?: string;
  createdAt: string;
  ownerUserId?: string;
  description?: string;
}

export interface MusicGenre {
  id: string;
  name: string;
  createdAt: string;
  createdBy?: GenreCreatorType;
  createdByUserId?: string;
}

export interface MusicPlaylist {
  id: string;
  userId: string;
  name: string;
  status: PlaylistStatus;
  coverTheme?: number;
  coverUrl?: string;
  createdAt: string;
}

export interface PlaylistSong {
  playlistId: string;
  songId: string;
  addedAt: string;
}

export interface LikedSong {
  userId: string;
  songId: string;
  createdAt: string;
}

export interface PlaylistFollow {
  userId: string;
  playlistId: string;
  createdAt: string;
}

export interface ListenHistory {
  userId: string;
  songId: string;
  listenedAt: string;
}

export interface ArtistRequest {
  id: string;
  userId: string;
  stageName: string;
  genre: string;
  bio: string;
  status: ArtistRequestStatus;
  rejectReason?: string;
  createdAt: string;
}

export interface CreateArtistRequestPayload {
  userId: string;
  stageName: string;
  genre: string;
  bio: string;
}

export interface CreatePlaylistPayload {
  userId: string;
  name: string;
  status: PlaylistStatus;
}

export interface CreateLocalSongPayload {
  ownerUserId: string;
  title: string;
  artistName: string;
  genreIds: string[];
  duration: string;
  description: string;
  thumbnailUrl: string;
  fileUrl: string;
}
