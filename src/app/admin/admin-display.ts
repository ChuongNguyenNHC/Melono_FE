import { RequestStatus, SongSource, SongStatus, UserRole, UserStatus } from './admin.models';

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
      return 'text-slate-300';
  }
}

export function getSongSourceClass(source: SongSource): string {
  return source === 'LOCAL' ? 'text-sky-300' : 'text-violet-300';
}

export function getUserStatusClass(status: UserStatus): string {
  return status === 'Active' ? 'text-emerald-300' : 'text-rose-300';
}

export function getUserRoleClass(role: UserRole): string {
  switch (role) {
    case 'USER':
      return 'text-slate-300';
    case 'ARTIST':
      return 'text-violet-300';
    case 'ADMIN':
      return 'text-sky-300';
    default:
      return 'text-slate-300';
  }
}

export function getArtistStatusClass(status: RequestStatus): string {
  switch (status) {
    case 'Pending':
      return 'text-amber-300';
    case 'Approved':
      return 'text-emerald-300';
    case 'Rejected':
      return 'text-rose-300';
    default:
      return 'text-slate-300';
  }
}

export function getSongStatusLabel(status: SongStatus): string {
  switch (status) {
    case 'Pending':
      return 'Ch\u1edd duy\u1ec7t';
    case 'Approved':
      return '\u0110\u00e3 duy\u1ec7t';
    case 'Rejected':
      return 'T\u1eeb ch\u1ed1i';
    case 'Hidden':
      return '\u0110\u00e3 \u1ea9n';
    default:
      return status;
  }
}

export function getSongSourceLabel(source: SongSource): string {
  switch (source) {
    case 'LOCAL':
      return '\u0110\u1ecba ph\u01b0\u01a1ng';
    case 'ITUNES':
      return 'iTunes';
    default:
      return source;
  }
}

export function getUserStatusLabel(status: UserStatus): string {
  switch (status) {
    case 'Active':
      return 'Ho\u1ea1t \u0111\u1ed9ng';
    case 'Banned':
      return 'B\u1ecb kh\u00f3a';
    default:
      return status;
  }
}

export function getUserRoleLabel(role: UserRole): string {
  switch (role) {
    case 'USER':
      return 'Ng\u01b0\u1eddi d\u00f9ng';
    case 'ARTIST':
      return 'Ngh\u1ec7 s\u0129';
    case 'ADMIN':
      return 'Qu\u1ea3n tr\u1ecb vi\u00ean';
    default:
      return role;
  }
}

export function getArtistStatusLabel(status: RequestStatus): string {
  switch (status) {
    case 'Pending':
      return 'Ch\u1edd duy\u1ec7t';
    case 'Approved':
      return '\u0110\u00e3 duy\u1ec7t';
    case 'Rejected':
      return 'T\u1eeb ch\u1ed1i';
    default:
      return status;
  }
}
