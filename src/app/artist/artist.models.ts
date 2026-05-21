export type ArtistViewMode = 'list' | 'upload' | 'edit';
export type SongStatus = 'Pending' | 'Approved' | 'Rejected' | 'Hidden';
export type SongSource = 'LOCAL' | 'ITUNES';

export type ArtistModalType = 'deleteSong' | null;
export type ArtistDrawerType = 'song' | null;

export interface ArtistSongItem {
  id: string;
  title: string;
  genre: string;
  uploadDate: string;
  status: SongStatus;
  note: string;
  thumbnail: string;
  source: SongSource;
  duration: string;
  description: string;
  audioUrl?: string;
  rejectReason?: string;
  likeCount: number;
  listenCount: number;
}

export interface SongFormData {
  title: string;
  genres: string[];
  stageName: string;
  description: string;
  duration: string;
  audioFileName: string;
  audioFileUrl: string;
  thumbnailUrl: string;
}
