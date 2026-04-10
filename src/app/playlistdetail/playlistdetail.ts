import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { Footer } from '../footer/footer';
import { MusicService, Song } from '../services/music.service';
import { PlayerService } from '../services/player.service';

@Component({
  selector: 'app-playlistdetail',
  standalone: true,
  imports: [CommonModule, Footer, RouterModule],
  templateUrl: './playlistdetail.html',
  styleUrl: './playlistdetail.css'
})
export class PlaylistDetail implements OnInit {
  musicService = inject(MusicService);
  playerService = inject(PlayerService);
  route = inject(ActivatedRoute);
  cdr = inject(ChangeDetectorRef);

  playlistId: string | null = null;
  playlistData: any = {};
  songs: Song[] = [];

  // MOCK DATA Mapping
  private mockPlaylists: { [key: string]: any } = {
    '1': { title: 'Today\'s Top Hits', description: 'The most played songs right now.', coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&auto=format&fit=crop', bgColor: 'from-[#651c20]', query: 'pop hit' },
    '2': { title: 'Chill Vibes', description: 'Relax and unwind with these smooth tracks.', coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300&auto=format&fit=crop', bgColor: 'from-[#352528]', query: 'lofi' },
    '3': { title: 'Mega Hit Mix', description: 'A mega mix of 75 favorites from the last few years!', coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=300&auto=format&fit=crop', bgColor: 'from-[#2e1d52]', query: 'hit mix' },
    '4': { title: 'Focus Flow', description: 'Uptempo instrumental hip hop to help you focus.', coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&auto=format&fit=crop', bgColor: 'from-[#112429]', query: 'instrumental focus' },
    '5': { title: 'Workout Beast', description: 'Get pumped with these high-energy tracks.', coverUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=300&auto=format&fit=crop', bgColor: 'from-[#1d201c]', query: 'workout edm' },
    '6': { title: 'Acoustic Covers', description: 'Beautiful acoustic renditions of popular songs.', coverUrl: 'https://images.unsplash.com/photo-1458560871784-56d23406c091?q=80&w=300&auto=format&fit=crop', bgColor: 'from-[#1c1c1c]', query: 'acoustic cover' },
    '7': { title: 'Midnight Jazz', description: 'Late night jazz to wind down your day.', coverUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=300&auto=format&fit=crop', bgColor: 'from-[#42312b]', query: 'jazz' },
    '8': { title: 'Electronic Dance', description: 'The best EDM tracks for your weekend party.', coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=300&auto=format&fit=crop', bgColor: 'from-[#144246]', query: 'electronic dance' }
  };

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.playlistId = params.get('id');
      const idStr = this.playlistId || '1';

      // Get predefined playlist or fallback
      this.playlistData = this.mockPlaylists[idStr] || {
        title: 'Playlist Của Bạn',
        description: 'Tận hưởng âm nhạc theo phong cách riêng.',
        coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/83/cb/bc/83cbbc49-cfad-aeaf-3292-0dd428290d81/198704942365_Cover.jpg/300x300bb.jpg',
        bgColor: 'from-[#2b4239]',
        query: 'vietnam'
      };

      this.fetchSongs();
    });
  }

  fetchSongs() {
    // mock the playlist songs by calling iTunes search based on the ID to get random assortments
    const query = this.playlistData.query || 'pop';
    this.musicService.searchSongs(query, 20).subscribe({
      next: (data) => {
        this.songs = data;
        this.cdr.detectChanges();
      },
      error: (e) => console.error(e)
    });
  }

  playSong(song: Song) {
    this.playerService.playSong(song, this.songs);
  }

  playAll() {
    if (this.songs.length > 0) {
      this.playerService.playSong(this.songs[0], this.songs);
    }
  }
}
