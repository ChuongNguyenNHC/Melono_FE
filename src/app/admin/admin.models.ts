export type AdminTab = 'songs' | 'users' | 'artists' | 'genres';
export type SongStatus = 'Pending' | 'Approved' | 'Rejected' | 'Hidden';
export type SongSource = 'LOCAL' | 'ITUNES';
export type UserRole = 'USER' | 'ARTIST' | 'ADMIN';
export type UserStatus = 'Active' | 'Banned';
export type RequestStatus = 'Pending' | 'Approved' | 'Rejected';

export type ModalType =
  | 'approveSong'
  | 'rejectSong'
  | 'hideSong'
  | 'banUser'
  | 'unbanUser'
  | 'approveArtist'
  | 'rejectArtist'
  | null;

export type DrawerType = 'song' | 'user' | 'artist' | null;

export interface SongItem {
  id: string;
  title: string;
  album: string;
  artist: string;
  thumbnail: string;
  source: SongSource;
  duration: string;
  createdAt: string;
  status: SongStatus;
  audioUrl: string;
  rejectReason?: string;
}

export interface UserRecord {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  playlistCount: number;
  likedSongsCount: number;
  banReason?: string;
}

export interface ArtistRequest {
  id: string;
  userId: string;
  userName: string;
  email: string;
  avatar: string;
  stageName: string;
  genre: string;
  bio: string;
  createdAt: string;
  status: RequestStatus;
  rejectReason?: string;
}
