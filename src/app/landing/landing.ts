import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Playlistsbar } from '../playlistsbar/playlistsbar';
import { Footer } from '../footer/footer';
import { MusicService, Song } from '../services/music.service';
import { PlayerService } from '../services/player.service';

interface Playlist {
  id: number;
  title: string;
  description: string;
  coverUrl: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, Playlistsbar, Footer],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing implements OnInit {
  musicService = inject(MusicService);
  playerService = inject(PlayerService);

  topSongs: Song[] = [];
  recentSongs: Song[] = [];

  showAllPlaylists = false;
  showAllSongs = false;

  topPlaylists: Playlist[] = [
    {
      id: 1,
      title: 'Today\'s Top Hits',
      description: 'The most played songs right now.',
      coverUrl: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f5f92b?q=80&w=300&auto=format&fit=crop'
    },
    {
      id: 2,
      title: 'Chill Vibes',
      description: 'Relax and unwind with these smooth tracks.',
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300&auto=format&fit=crop'
    },
    {
      id: 3,
      title: 'Mega Hit Mix',
      description: 'A mega mix of 75 favorites from the last few years!',
      coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=300&auto=format&fit=crop'
    },
    {
      id: 4,
      title: 'Focus Flow',
      description: 'Uptempo instrumental hip hop to help you focus.',
      coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&auto=format&fit=crop'
    },
    {
      id: 5,
      title: 'Workout Beast',
      description: 'Get pumped with these high-energy tracks.',
      coverUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=300&auto=format&fit=crop'
    },
    {
      id: 6,
      title: 'Acoustic Covers',
      description: 'Beautiful acoustic renditions of popular songs.',
      coverUrl: 'https://images.unsplash.com/photo-1542283620-30b1bc7e4df8?q=80&w=300&auto=format&fit=crop'
    },
    {
      id: 7,
      title: 'Midnight Jazz',
      description: 'Late night jazz to wind down your day.',
      coverUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=300&auto=format&fit=crop'
    },
    {
      id: 8,
      title: 'Electronic Dance',
      description: 'The best EDM tracks for your weekend party.',
      coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=300&auto=format&fit=crop'
    }
  ];

  toggleShowAllPlaylists() {
    this.showAllPlaylists = !this.showAllPlaylists;
  }

  toggleShowAllSongs() {
    this.showAllSongs = !this.showAllSongs;
  }

  ngOnInit() {
    this.musicService.searchSongs('pop 2024', 12).subscribe({
      next: (songs) => this.topSongs = songs,
      error: (err) => console.error('Failed to fetch top songs', err)
    });

    this.musicService.searchSongs('vpop', 4).subscribe({
      next: (songs) => this.recentSongs = songs,
      error: (err) => console.error('Failed to fetch recent songs', err)
    });
  }

  playSong(song: Song) {
    this.playerService.playSong(song);
  }
}
