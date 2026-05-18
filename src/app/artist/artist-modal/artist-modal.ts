import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { ArtistModalType, ArtistSongItem } from '../artist.models';

@Component({
  selector: 'app-artist-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './artist-modal.html',
})
export class ArtistModal {
  @Input() isOpen = false;
  @Input() modalType: ArtistModalType = null;
  @Input() songPendingDelete: ArtistSongItem | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() confirmDeleteSong = new EventEmitter<void>();
}
