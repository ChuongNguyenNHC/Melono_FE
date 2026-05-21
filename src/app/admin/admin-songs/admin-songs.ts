import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  getSongStatusClass,
  getSongStatusLabel,
} from '../admin-display';
import { SongItem, SongStatus } from '../admin.models';

@Component({
  selector: 'app-admin-songs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-songs.html',
})
export class AdminSongs {
  @Input() songs: SongItem[] = [];
  @Input() search = '';
  @Input() statusFilter: SongStatus | 'ALL' = 'ALL';

  @Output() searchChange = new EventEmitter<string>();
  @Output() statusFilterChange = new EventEmitter<SongStatus | 'ALL'>();
  @Output() refresh = new EventEmitter<void>();
  @Output() openDrawer = new EventEmitter<SongItem>();
  @Output() approve = new EventEmitter<SongItem>();
  @Output() reject = new EventEmitter<SongItem>();
  @Output() hide = new EventEmitter<SongItem>();
  @Output() restore = new EventEmitter<SongItem>();

  readonly getSongStatusClass = getSongStatusClass;
  readonly getSongStatusLabel = getSongStatusLabel;

  trackById(_index: number, item: SongItem): string {
    return item.id;
  }
}
