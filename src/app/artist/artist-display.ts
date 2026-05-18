import { SongSource, SongStatus } from './artist.models';

export function getSongStatusLabel(status: SongStatus): string {
  switch (status) {
    case 'Pending':
      return 'Chờ duyệt';
    case 'Approved':
      return 'Đã duyệt';
    case 'Rejected':
      return 'Từ chối';
    case 'Hidden':
      return 'Đã ẩn';
    default:
      return status;
  }
}

export function getSongStatusClass(status: SongStatus): string {
  switch (status) {
    case 'Pending':
      return 'text-amber-300';
    case 'Approved':
      return 'text-emerald-300';
    case 'Rejected':
      return 'text-rose-300';
    case 'Hidden':
      return 'text-slate-300';
    default:
      return 'text-white';
  }
}

export function getSongSourceLabel(source: SongSource): string {
  switch (source) {
    case 'LOCAL':
      return 'Địa phương';
    case 'ITUNES':
      return 'iTunes';
    default:
      return source;
  }
}
