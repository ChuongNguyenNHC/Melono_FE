import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ArtistRequest, ModalType, SongItem, UserRecord } from '../admin.models';

@Component({
  selector: 'app-admin-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-modal.html',
})
export class AdminModal {
  @Input() isOpen = false;
  @Input() modalType: ModalType = null;
  @Input() selectedSong: SongItem | null = null;
  @Input() selectedUser: UserRecord | null = null;
  @Input() selectedArtistRequest: ArtistRequest | null = null;
  @Input() rejectSongReason = '';
  @Input() banReason = '';
  @Input() rejectArtistReason = '';

  @Output() close = new EventEmitter<void>();
  @Output() rejectSongReasonChange = new EventEmitter<string>();
  @Output() banReasonChange = new EventEmitter<string>();
  @Output() rejectArtistReasonChange = new EventEmitter<string>();
  @Output() confirmApproveSong = new EventEmitter<void>();
  @Output() confirmRejectSong = new EventEmitter<void>();
  @Output() confirmHideSong = new EventEmitter<void>();
  @Output() confirmBanUser = new EventEmitter<void>();
  @Output() confirmUnbanUser = new EventEmitter<void>();
  @Output() confirmApproveArtist = new EventEmitter<void>();
  @Output() confirmRejectArtist = new EventEmitter<void>();
}
