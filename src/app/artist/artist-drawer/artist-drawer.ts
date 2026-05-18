import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { getSongStatusClass, getSongStatusLabel } from '../artist-display';
import { ArtistDrawerType, ArtistSongItem } from '../artist.models';

@Component({
  selector: 'app-artist-drawer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './artist-drawer.html',
})
export class ArtistDrawer {
  @Input() isOpen = false;
  @Input() drawerType: ArtistDrawerType = null;
  @Input() selectedSong: ArtistSongItem | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() editSong = new EventEmitter<ArtistSongItem>();

  readonly getSongStatusClass = getSongStatusClass;
  readonly getSongStatusLabel = getSongStatusLabel;
}
