import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MusicSong } from '../models/music-domain.models';
import { MusicLibraryService } from '../services/music-library.service';
import { MusicService, Song } from '../services/music.service';
import { PlayerService } from '../services/player.service';

@Component({
  selector: 'app-genre',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './genre.html',
  styleUrl: './genre.css',
})
export class Genre implements OnInit {
  readonly libraryService = inject(MusicLibraryService);
  private readonly playerService = inject(PlayerService);
  private readonly musicService = inject(MusicService);
  readonly genres$ = this.libraryService.genres$;

  chartSongs: Song[] = this.fallbackChartSongs;
  popSongs: Song[] = this.fallbackPopSongs;
  rapSongs: Song[] = this.fallbackRapSongs;
  acousticSongs: Song[] = this.fallbackAcousticSongs;
  expandedSection: 'pop' | 'rap' | 'acoustic' | null = null;
  genreSearch = '';

  @ViewChild('popSection') private popSection?: ElementRef<HTMLElement>;
  @ViewChild('rapSection') private rapSection?: ElementRef<HTMLElement>;
  @ViewChild('acousticSection') private acousticSection?: ElementRef<HTMLElement>;

  ngOnInit(): void {
    this.musicService.fetchChart('vn', 8).subscribe({
      next: songs => {
        if (songs.length) this.chartSongs = songs;
      },
      error: error => console.error(error),
    });

    this.musicService.searchItunesSongs('pop hits', 12).subscribe({
      next: songs => {
        if (songs.length) this.popSongs = songs;
      },
      error: error => console.error(error),
    });

    this.musicService.searchItunesSongs('rap hits', 12).subscribe({
      next: songs => {
        if (songs.length) this.rapSongs = songs;
      },
      error: error => console.error(error),
    });

    this.musicService.searchItunesSongs('acoustic ballad', 12).subscribe({
      next: songs => {
        if (songs.length) this.acousticSongs = songs;
      },
      error: error => console.error(error),
    });
  }

  getSongCount(genreId: string): number {
    return this.libraryService.getSongsByGenre(genreId).length;
  }

  getSongsByGenre(genreId: string) {
    return this.libraryService.getSongsByGenre(genreId);
  }

  getItunesSongsByGenre(genreId: string): Song[] {
    const genreName = this.snapshotGenreName(genreId);

    if (genreName.includes('rap')) return this.rapSongs;
    if (genreName.includes('acoustic') || genreName.includes('ballad')) return this.acousticSongs;
    return this.popSongs;
  }

  get filteredGenres() {
    const keyword = this.genreSearch.trim().toLowerCase();
    const genres = this.libraryService.snapshot.genres;

    if (!keyword) return genres;
    return genres.filter(genre => genre.name.toLowerCase().includes(keyword));
  }

  scrollToGenre(genreName: string): void {
    const normalized = genreName.toLowerCase();
    let target = this.popSection;

    if (normalized.includes('rap')) {
      target = this.rapSection;
    } else if (normalized.includes('acoustic') || normalized.includes('ballad')) {
      target = this.acousticSection;
    }

    target?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  playSong(song: MusicSong): void {
    this.playerService.playSong({
      id: song.id,
      title: song.title,
      artist: song.artistName,
      coverUrl: song.thumbnailUrl,
      previewUrl: song.fileUrl || song.previewUrl || '',
      duration: song.duration,
      plays: 'Local',
    });
  }

  toggleLike(song: MusicSong): void {
    this.libraryService.toggleLikeSong(this.libraryService.currentUserId, song.id);
  }

  playItunesSong(song: Song): void {
    this.playerService.playSong(song, this.chartSongs);
  }

  playGenreSong(song: Song, section: 'pop' | 'rap' | 'acoustic'): void {
    this.playerService.playSong(song, this.getSectionSongs(section));
  }

  likeItunesSong(song: Song, genreId: string): void {
    const savedSongId = this.libraryService.saveItunesSong({
      ...song,
      genreId,
    });

    this.libraryService.toggleLikeSong(this.libraryService.currentUserId, savedSongId);
  }

  toggleSection(section: 'pop' | 'rap' | 'acoustic'): void {
    this.expandedSection = this.expandedSection === section ? null : section;
  }

  isExpanded(section: 'pop' | 'rap' | 'acoustic'): boolean {
    return this.expandedSection === section;
  }

  getSectionSongs(section: 'pop' | 'rap' | 'acoustic'): Song[] {
    switch (section) {
      case 'rap':
        return this.rapSongs;
      case 'acoustic':
        return this.acousticSongs;
      default:
        return this.popSongs;
    }
  }

  snapshotGenreName(genreId: string | null): string {
    if (!genreId) return '';
    return this.libraryService.snapshot.genres.find(genre => genre.id === genreId)?.name.toLowerCase() || '';
  }

  private get fallbackPopSongs(): Song[] {
    return [
      this.createFallbackSong(101, 'Pop Rising', 'Melono Picks', 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=300&auto=format&fit=crop'),
      this.createFallbackSong(102, 'Ánh sáng cuối tuần', 'Sóng Mặt Trăng', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=300&auto=format&fit=crop'),
      this.createFallbackSong(103, 'Trái tim neon', 'Tiếng vọng thành phố', 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=300&auto=format&fit=crop'),
      this.createFallbackSong(104, 'Giờ vàng', 'Mira', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300&auto=format&fit=crop'),
      this.createFallbackSong(105, 'Ngày xanh', 'Cloud Nine', 'https://images.unsplash.com/photo-1501612780327-45045538702b?q=80&w=300&auto=format&fit=crop'),
      this.createFallbackSong(106, 'Đường sáng', 'Nova', 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=300&auto=format&fit=crop'),
      this.createFallbackSong(107, 'Summer Loop', 'Pixel Pop', 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?q=80&w=300&auto=format&fit=crop'),
      this.createFallbackSong(108, 'City Love', 'Amber', 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=300&auto=format&fit=crop'),
    ];
  }

  private get fallbackRapSongs(): Song[] {
    return [
      this.createFallbackSong(201, 'Flow Đêm', 'Beat District', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=300&auto=format&fit=crop'),
      this.createFallbackSong(202, 'Bassline', 'Northside', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=300&auto=format&fit=crop'),
      this.createFallbackSong(203, 'Street Verse', 'K-Low', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=300&auto=format&fit=crop'),
      this.createFallbackSong(204, 'Midnight Bars', 'Mono G', 'https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=300&auto=format&fit=crop'),
      this.createFallbackSong(205, 'Nhịp phố', 'Urban Kid', 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=300&auto=format&fit=crop'),
      this.createFallbackSong(206, 'Verse mới', 'Lowkey', 'https://images.unsplash.com/photo-1482442120256-9c03866de390?q=80&w=300&auto=format&fit=crop'),
      this.createFallbackSong(207, 'Beat nóng', 'District 8', 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=300&auto=format&fit=crop'),
      this.createFallbackSong(208, 'Đêm freestyle', 'MC Light', 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=300&auto=format&fit=crop'),
    ];
  }

  private get fallbackAcousticSongs(): Song[] {
    return [
      this.createFallbackSong(301, 'Mưa Nhẹ', 'Acoustic Room', 'https://images.unsplash.com/photo-1458560871784-56d23406c091?q=80&w=300&auto=format&fit=crop'),
      this.createFallbackSong(302, 'Gió Qua Thềm', 'An Nhiên', 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=300&auto=format&fit=crop'),
      this.createFallbackSong(303, 'Phố Cũ', 'Hoàng Mộc', 'https://images.unsplash.com/photo-1485579149621-3123dd979885?q=80&w=300&auto=format&fit=crop'),
      this.createFallbackSong(304, 'Tựa Vai', 'Minh Acoustic', 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?q=80&w=300&auto=format&fit=crop'),
      this.createFallbackSong(305, 'Mây lặng', 'Lofi Guitar', 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?q=80&w=300&auto=format&fit=crop'),
      this.createFallbackSong(306, 'Chiều yên', 'An Acoustic', 'https://images.unsplash.com/photo-1519683109079-d5f539e1542f?q=80&w=300&auto=format&fit=crop'),
      this.createFallbackSong(307, 'Đêm mộc', 'Wooden Notes', 'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?q=80&w=300&auto=format&fit=crop'),
      this.createFallbackSong(308, 'Lời ru phố', 'Mộc Band', 'https://images.unsplash.com/photo-1487215078519-e21cc028cb29?q=80&w=300&auto=format&fit=crop'),
    ];
  }

  private get fallbackChartSongs(): Song[] {
    return [...this.fallbackPopSongs, ...this.fallbackRapSongs].slice(0, 8);
  }

  private createFallbackSong(id: number, title: string, artist: string, coverUrl: string): Song {
    return {
      id: `genre-fallback-${id}`,
      title,
      artist,
      coverUrl,
      previewUrl: 'assets/audio/demo-song.mp3',
      duration: '03:30',
      plays: 'Melono',
    };
  }
}
