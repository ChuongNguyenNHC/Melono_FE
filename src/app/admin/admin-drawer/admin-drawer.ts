import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import {
  getArtistStatusClass,
  getArtistStatusLabel,
  getSongStatusClass,
  getSongStatusLabel,
  getUserRoleClass,
  getUserRoleLabel,
  getUserStatusClass,
  getUserStatusLabel,
} from '../admin-display';
import { ArtistRequest, DrawerType, SongItem, UserRecord } from '../admin.models';

@Component({
  selector: 'app-admin-drawer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-drawer.html',
})
export class AdminDrawer {
  @Input() isOpen = false;
  @Input() drawerType: DrawerType = null;
  @Input() selectedSong: SongItem | null = null;
  @Input() selectedUser: UserRecord | null = null;
  @Input() selectedArtistRequest: ArtistRequest | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() approveSong = new EventEmitter<SongItem>();
  @Output() rejectSong = new EventEmitter<SongItem>();
  @Output() hideSong = new EventEmitter<SongItem>();
  @Output() restoreSong = new EventEmitter<SongItem>();
  @Output() banUser = new EventEmitter<UserRecord>();
  @Output() unbanUser = new EventEmitter<UserRecord>();
  @Output() approveArtist = new EventEmitter<ArtistRequest>();
  @Output() rejectArtist = new EventEmitter<ArtistRequest>();

  readonly getSongStatusClass = getSongStatusClass;
  readonly getSongStatusLabel = getSongStatusLabel;
  readonly getUserRoleClass = getUserRoleClass;
  readonly getUserStatusClass = getUserStatusClass;
  readonly getUserRoleLabel = getUserRoleLabel;
  readonly getUserStatusLabel = getUserStatusLabel;
  readonly getArtistStatusClass = getArtistStatusClass;
  readonly getArtistStatusLabel = getArtistStatusLabel;
}
