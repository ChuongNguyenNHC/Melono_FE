import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { getArtistStatusClass, getArtistStatusLabel } from '../admin-display';
import { ArtistRequest, RequestStatus } from '../admin.models';

@Component({
  selector: 'app-admin-artists',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-artists.html',
})
export class AdminArtists {
  @Input() requests: ArtistRequest[] = [];
  @Input() search = '';
  @Input() statusFilter: RequestStatus | 'ALL' = 'ALL';

  @Output() searchChange = new EventEmitter<string>();
  @Output() statusFilterChange = new EventEmitter<RequestStatus | 'ALL'>();
  @Output() refresh = new EventEmitter<void>();
  @Output() openDrawer = new EventEmitter<ArtistRequest>();
  @Output() approve = new EventEmitter<ArtistRequest>();
  @Output() reject = new EventEmitter<ArtistRequest>();

  readonly getArtistStatusClass = getArtistStatusClass;
  readonly getArtistStatusLabel = getArtistStatusLabel;

  trackById(_index: number, item: ArtistRequest): string {
    return item.id;
  }
}
