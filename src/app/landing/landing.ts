import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Footer } from '../footer/footer';
import { MusicService, Song } from '../services/music.service';
import { PlayerService } from '../services/player.service';

interface Playlist {
  id: number;
  title: string;
  description: string;
  coverUrl: string;
}

interface Artist {
  id: number;
  name: string;
  imageUrl: string;
}

interface Mood {
  id: number;
  name: string;
  color: string;
  bgColor: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, Footer],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing implements OnInit {
  musicService = inject(MusicService);
  playerService = inject(PlayerService);
  cdr = inject(ChangeDetectorRef);
  router = inject(Router);

  topSongs: Song[] = [];
  recentSongs: Song[] = [];
  
  navigateToPlaylist(id: number) {
    this.router.navigate(['/playlist', id]);
  }
  
  vpopSongs: Song[] = [];
  usukSongs: Song[] = [];
  kpopSongs: Song[] = [];
  chartSongs: Song[] = [];

  showAllPlaylists = false;
  showAllSongs = false;
  
  greeting = 'Chào buổi sáng';

  topArtists: Artist[] = [];

  topPlaylists: Playlist[] = [
    {
      id: 1,
      title: 'Today\'s Top Hits',
      description: 'The most played songs right now.',
      coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&auto=format&fit=crop'
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
      coverUrl: 'https://images.unsplash.com/photo-1458560871784-56d23406c091?q=80&w=300&auto=format&fit=crop'
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
    this.setGreeting();

    this.musicService.searchSongs('pop 2024', 12).subscribe({
      next: (songs) => {
        this.topSongs = songs;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to fetch top songs', err)
    });

    this.musicService.searchSongs('vpop', 4).subscribe({
      next: (songs) => {
        this.recentSongs = songs;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to fetch recent songs', err)
    });

    this.musicService.getTopArtists('trending pop', 6).subscribe({
      next: (artists) => {
        this.topArtists = artists;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to fetch top artists', err)
    });

    // Keep search fallback for general queries
    this.musicService.searchSongs('nhạc việt', 12).subscribe({
      next: (songs) => {
        this.vpopSongs = songs;
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });

    this.musicService.fetchChart('us', 12).subscribe({
      next: (songs) => {
        this.usukSongs = songs;
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });

    this.musicService.fetchChart('kr', 12).subscribe({
      next: (songs) => {
        this.kpopSongs = songs;
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });

    this.musicService.fetchChart('vn', 10).subscribe({
      next: (songs) => {
        this.chartSongs = songs;
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  setGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) {
      this.greeting = 'Chào buổi sáng';
    } else if (hour < 18) {
      this.greeting = 'Chào buổi chiều';
    } else {
      this.greeting = 'Chào buổi tối';
    }
  }

  playSong(song: Song, context?: Song[]) {
    this.playerService.playSong(song, context || this.topSongs);
  }
}

