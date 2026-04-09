import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Playlistsbar } from '../playlistsbar/playlistsbar';
import { Footer } from '../footer/footer';

interface Song {
  id: number;
  title: string;
  artist: string;
  coverUrl: string;
  duration: string;
  plays: string;
}

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
export class Landing {
  topSongs: Song[] = [
    {
      id: 1,
      title: 'Blinding Lights',
      artist: 'The Weeknd',
      coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200&auto=format&fit=crop',
      duration: '3:20',
      plays: '3.4B'
    },
    {
      id: 2,
      title: 'Shape of You',
      artist: 'Ed Sheeran',
      coverUrl: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f5f92b?q=80&w=200&auto=format&fit=crop',
      duration: '3:53',
      plays: '3.3B'
    },
    {
      id: 3,
      title: 'Someone You Loved',
      artist: 'Lewis Capaldi',
      coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=200&auto=format&fit=crop',
      duration: '3:02',
      plays: '2.8B'
    },
    {
      id: 4,
      title: 'Sunflower',
      artist: 'Post Malone, Swae Lee',
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=200&auto=format&fit=crop',
      duration: '2:38',
      plays: '2.5B'
    },
    {
      id: 5,
      title: 'As It Was',
      artist: 'Harry Styles',
      coverUrl: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=200&auto=format&fit=crop',
      duration: '2:47',
      plays: '2.3B'
    }
  ];

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
    }
  ];

  recentSongs: Song[] = [
    {
      id: 101,
      title: 'Levitating',
      artist: 'Dua Lipa',
      coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=200&auto=format&fit=crop',
      duration: '3:23',
      plays: '1.8B'
    },
    {
      id: 102,
      title: 'Watermelon Sugar',
      artist: 'Harry Styles',
      coverUrl: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?q=80&w=200&auto=format&fit=crop',
      duration: '2:54',
      plays: '2.1B'
    },
    {
      id: 103,
      title: 'STAY',
      artist: 'The Kid LAROI, Justin Bieber',
      coverUrl: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=200&auto=format&fit=crop',
      duration: '2:21',
      plays: '2.7B'
    },
    {
      id: 104,
      title: 'Good 4 U',
      artist: 'Olivia Rodrigo',
      coverUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=200&auto=format&fit=crop',
      duration: '2:58',
      plays: '1.9B'
    }
  ];
}
