import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayerComponent } from '../player/player';

export interface MyPlaylist {
  id: number;
  name: string;
}

@Component({
  selector: 'app-playlistsbar',
  standalone: true,
  imports: [CommonModule, PlayerComponent],
  templateUrl: './playlistsbar.html',
  styleUrl: './playlistsbar.css',
})
export class Playlistsbar {
  isExpanded = true;
  
  playlists: MyPlaylist[] = [
    { id: 1, name: 'Nhạc Chilling' },
    { id: 2, name: 'Top Hits Việt Nam' },
    { id: 3, name: 'US-UK EDM Mix' }
  ];

  toggleSidebar() {
    this.isExpanded = !this.isExpanded;
  }

  createPlaylist() {
    const newId = this.playlists.length > 0 ? Math.max(...this.playlists.map(p => p.id)) + 1 : 1;
    this.playlists.push({ id: newId, name: `Playlist số ${newId}` });
  }
}
