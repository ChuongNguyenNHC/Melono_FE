import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { getSongStatusClass, getSongStatusLabel } from '../artist-display';
import { ArtistSongItem, ArtistViewMode, SongFormData, SongStatus } from '../artist.models';

@Component({
  selector: 'app-artist-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './artist-management.html',
})
export class ArtistManagement {
  @Input() mode: ArtistViewMode = 'list';
  @Input() songs: ArtistSongItem[] = [];
  @Input() search = '';
  @Input() statusFilter: SongStatus | 'ALL' = 'ALL';
  @Input() songForm!: SongFormData;
  @Input() genreOptions: string[] = [];
  @Input() rejectedReason = '';

  @Output() searchChange = new EventEmitter<string>();
  @Output() statusFilterChange = new EventEmitter<SongStatus | 'ALL'>();
  @Output() refresh = new EventEmitter<void>();
  @Output() openUpload = new EventEmitter<void>();
  @Output() openEdit = new EventEmitter<ArtistSongItem>();
  @Output() openDelete = new EventEmitter<ArtistSongItem>();
  @Output() audioFileSelected = new EventEmitter<Event>();
  @Output() thumbnailFileSelected = new EventEmitter<Event>();
  @Output() cancelForm = new EventEmitter<void>();
  @Output() submitForm = new EventEmitter<void>();

  readonly getSongStatusClass = getSongStatusClass;
  readonly getSongStatusLabel = getSongStatusLabel;

  trackById(_index: number, item: ArtistSongItem): string {
    return item.id;
  }
}
