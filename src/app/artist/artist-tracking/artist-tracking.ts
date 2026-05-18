import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { getSongSourceLabel } from '../artist-display';
import { ArtistSongItem } from '../artist.models';

@Component({
  selector: 'app-artist-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './artist-tracking.html',
})
export class ArtistTracking {
  @Input() songs: ArtistSongItem[] = [];
  @Input() search = '';

  @Output() searchChange = new EventEmitter<string>();
  @Output() refresh = new EventEmitter<void>();
  @Output() openDrawer = new EventEmitter<ArtistSongItem>();

  readonly getSongSourceLabel = getSongSourceLabel;

  trackById(_index: number, item: ArtistSongItem): string {
    return item.id;
  }
}
