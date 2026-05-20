import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { PlayerComponent } from '../player/player';
import { PlaylistService, Playlist } from '../services/playlist.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-playlistsbar',
  standalone: true,
  imports: [CommonModule, PlayerComponent, RouterModule],
  templateUrl: './playlistsbar.html',
  styleUrl: './playlistsbar.css',
})
export class Playlistsbar implements OnInit {
  isExpanded = true;
  playlists: Playlist[] = [];
  searchTerm = '';

  private playlistService = inject(PlaylistService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  isPlaylistLocked(playlist: Playlist): boolean {
    const user = this.authService.currentUserValue;
    if (!user) return false;
    // Bị khóa nếu nó ở trạng thái PRIVATE và chủ sở hữu không phải là user hiện tại
    return playlist.status === 'PRIVATE' && playlist.userId !== user.id;
  }

  ngOnInit() {
    this.playlistService.playlists$.subscribe({
      next: (data) => {
        this.playlists = data;
        this.cdr.detectChanges();
      }
    });
    this.playlistService.getUserPlaylists().subscribe();
  }

  onSearchInput(event: Event) {
    this.searchTerm = (event.target as HTMLInputElement).value;
  }

  clearSearch() {
    this.searchTerm = '';
  }

  get filteredPlaylists(): Playlist[] {
    if (!this.searchTerm.trim()) {
      return this.playlists;
    }
    const query = this.searchTerm.toLowerCase().trim();
    return this.playlists.filter(p => p.name.toLowerCase().includes(query));
  }

  toggleSidebar() {
    this.isExpanded = !this.isExpanded;
  }

  createPlaylist() {
    const nextNumber = this.playlists.length + 1;
    this.playlistService.createPlaylist(`Danh sách phát #${nextNumber}`, 'PRIVATE').subscribe({
      next: (newPlaylist) => {
        if (newPlaylist.playlistId) {
          this.router.navigate(['/playlist', newPlaylist.playlistId]);
        }
      },
      error: (err) => console.error('Error creating playlist', err)
    });
  }
}
