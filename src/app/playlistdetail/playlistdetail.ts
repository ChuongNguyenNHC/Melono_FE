import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Footer } from '../footer/footer';
import { MusicPlaylist, MusicSong } from '../models/music-domain.models';
import { MusicLibraryService } from '../services/music-library.service';
import { MusicService, Song } from '../services/music.service';
import { PlayerService } from '../services/player.service';

interface PlaylistView {
  title: string;
  description: string;
  coverUrl?: string;
  bgColor: string;
  query: string;
  status?: 'PUBLIC' | 'PRIVATE';
  coverTheme?: number;
}

@Component({
  selector: 'app-playlistdetail',
  standalone: true,
  imports: [CommonModule, FormsModule, Footer, RouterModule],
  templateUrl: './playlistdetail.html',
  styleUrl: './playlistdetail.css',
})
export class PlaylistDetail implements OnInit {
  private readonly musicService = inject(MusicService);
  private readonly playerService = inject(PlayerService);
  private readonly libraryService = inject(MusicLibraryService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  playlistId: string | null = null;
  playlistData: PlaylistView = this.fallbackPlaylist;
  localPlaylist: MusicPlaylist | null = null;
  songs: Song[] = [];
  editingName = '';
  editingStatus: 'PUBLIC' | 'PRIVATE' = 'PRIVATE';
  editingCoverUrl = '';
  selectedTheme = 0;
  shareMessage = '';

  readonly playlistThemes = [
    'from-[#d9b466] via-[#9b728e] to-[#5b2d90]',
    'from-[#f7d047] via-[#e99a24] to-[#c15a00]',
    'from-[#ef4444] via-[#b63f30] to-[#7c2d12]',
    'from-[#93c5fd] via-[#60a5fa] to-[#312e81]',
    'from-[#34d399] via-[#10b981] to-[#064e3b]',
  ];

  private readonly defaultSuggestedPlaylists: Record<string, PlaylistView> = {
    '1': {
      title: 'Today\'s Top Hits',
      description: 'The most played songs right now.',
      coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=500&auto=format&fit=crop',
      bgColor: 'from-[#651c20]',
      query: 'top hits pop',
    },
    '2': {
      title: 'Chill Vibes',
      description: 'Relax and unwind with these smooth tracks.',
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop',
      bgColor: 'from-[#352528]',
      query: 'lofi chill',
    },
    '3': {
      title: 'Mega Hit Mix',
      description: 'A mega mix of 75 favorites from the last few years.',
      coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=500&auto=format&fit=crop',
      bgColor: 'from-[#2e1d52]',
      query: 'mega hit mix',
    },
    '4': {
      title: 'Focus Flow',
      description: 'Uptempo instrumental hip hop to help you focus.',
      coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=500&auto=format&fit=crop',
      bgColor: 'from-[#112429]',
      query: 'focus instrumental',
    },
    '5': {
      title: 'Workout Beast',
      description: 'Get pumped with these high-energy tracks.',
      coverUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=500&auto=format&fit=crop',
      bgColor: 'from-[#1d201c]',
      query: 'workout edm',
    },
    '6': {
      title: 'Acoustic Covers',
      description: 'Beautiful acoustic renditions of popular songs.',
      coverUrl: 'https://images.unsplash.com/photo-1458560871784-56d23406c091?q=80&w=500&auto=format&fit=crop',
      bgColor: 'from-[#1c1c1c]',
      query: 'acoustic cover',
    },
    '7': {
      title: 'Midnight Jazz',
      description: 'Late night jazz to wind down your day.',
      coverUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=500&auto=format&fit=crop',
      bgColor: 'from-[#42312b]',
      query: 'midnight jazz',
    },
    '8': {
      title: 'Electronic Dance',
      description: 'The best EDM tracks for your weekend party.',
      coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=500&auto=format&fit=crop',
      bgColor: 'from-[#144246]',
      query: 'electronic dance',
    },
  };

  private get fallbackPlaylist(): PlaylistView {
    return {
      title: 'Playlist của bạn',
      description: 'Tận hưởng âm nhạc theo phong cách riêng.',
      bgColor: 'from-[#2b4239]',
      query: 'vietnam',
    };
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.playlistId = params.get('id');
      this.loadPlaylist();
    });
  }

  playSong(song: Song): void {
    this.playerService.playSong(song, this.songs);
  }

  playAll(): void {
    if (this.songs.length) {
      this.playerService.playSong(this.songs[0], this.songs);
    }
  }

  savePlaylist(): void {
    if (!this.localPlaylist || !this.editingName.trim()) return;

    this.libraryService.updatePlaylist(this.localPlaylist.id, {
      name: this.editingName.trim(),
      status: this.editingStatus,
      coverTheme: this.selectedTheme,
      coverUrl: this.editingCoverUrl.trim(),
    });

    this.localPlaylist = {
      ...this.localPlaylist,
      name: this.editingName.trim(),
      status: this.editingStatus,
      coverTheme: this.selectedTheme,
      coverUrl: this.editingCoverUrl.trim(),
    };
    this.playlistData = this.buildLocalPlaylistData(this.localPlaylist);
    this.shareMessage = 'Đã lưu thay đổi';
  }

  sharePlaylist(): void {
    const text = `${this.playlistData.title} - ${window.location.href}`;
    navigator.clipboard?.writeText(text);
    this.shareMessage = 'Đã sao chép liên kết chia sẻ';
  }

  deletePlaylist(): void {
    if (!this.localPlaylist) return;

    this.libraryService.deletePlaylist(this.localPlaylist.id);
    this.goBackToLibrary();
  }

  goBackToLibrary(): void {
    this.router.navigate(['/library']);
  }

  onCoverFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.editingCoverUrl = String(reader.result || '');
      this.playlistData = { ...this.playlistData, coverUrl: this.editingCoverUrl };
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  getTheme(index: number): string {
    return this.playlistThemes[index % this.playlistThemes.length];
  }

  private loadPlaylist(): void {
    const id = this.playlistId || '1';
    const local = id.startsWith('pl') ? this.libraryService.getPlaylistById(id) : undefined;

    if (local) {
      this.localPlaylist = local;
      this.editingName = local.name;
      this.editingStatus = local.status;
      this.editingCoverUrl = local.coverUrl || '';
      this.selectedTheme = local.coverTheme ?? 0;
      this.playlistData = this.buildLocalPlaylistData(local);
      this.songs = this.libraryService.getPlaylistSongs(local.id).map(song => this.toPlayableSong(song));
      this.cdr.detectChanges();
      return;
    }

    const params = this.route.snapshot.queryParamMap;
    const title = params.get('title');
    const artist = params.get('artist') || 'iTunes';
    const coverUrl = params.get('cover') || undefined;
    const query = params.get('query') || title || 'vietnam hits';

    this.localPlaylist = null;
    this.playlistData = title
      ? {
          title,
          description: `${artist} • playlist gợi ý từ iTunes`,
          coverUrl,
          bgColor: 'from-[#292238]',
          query,
        }
      : this.defaultSuggestedPlaylists[id] || {
          title: 'Playlist iTunes',
          description: 'Playlist gợi ý từ iTunes.',
          bgColor: 'from-[#292238]',
          query,
        };
    this.fetchSuggestedSongs(this.playlistData.query);
  }

  private fetchSuggestedSongs(query: string): void {
    this.musicService.searchItunesSongs(query, 20).subscribe({
      next: songs => {
        this.songs = songs;
        this.cdr.detectChanges();
      },
      error: error => console.error(error),
    });
  }

  private buildLocalPlaylistData(playlist: MusicPlaylist): PlaylistView {
    return {
      title: playlist.name,
      description: playlist.status === 'PUBLIC'
        ? 'Playlist công khai trong thư viện Melono.'
        : 'Playlist riêng tư của bạn.',
      coverUrl: playlist.coverUrl,
      bgColor: this.getTheme(playlist.coverTheme ?? 0),
      query: 'vietnam',
      status: playlist.status,
      coverTheme: playlist.coverTheme ?? 0,
    };
  }

  private toPlayableSong(song: MusicSong): Song {
    return {
      id: song.id,
      title: song.title,
      artist: song.artistName,
      coverUrl: song.thumbnailUrl,
      previewUrl: song.fileUrl || song.previewUrl || '',
      duration: song.duration,
      plays: 'Local',
    };
  }
}
