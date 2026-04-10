import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Footer } from '../footer/footer';
import { MusicService, Song } from '../services/music.service';
import { PlayerService } from '../services/player.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, Footer],
  templateUrl: './search.html',
  styleUrl: './search.css'
})
export class Search implements OnInit {
  route = inject(ActivatedRoute);
  musicService = inject(MusicService);
  playerService = inject(PlayerService);
  cdr = inject(ChangeDetectorRef);

  query: string = '';
  songs: Song[] = [];
  topResult: Song | null = null;
  isLoading = false;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.query = params['q'] || '';
      if (this.query) {
        this.performSearch();
      } else {
        this.songs = [];
        this.topResult = null;
        this.cdr.detectChanges();
      }
    });
  }

  performSearch() {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.musicService.searchSongs(this.query, 30).subscribe({
      next: (data) => {
        this.songs = data;
        // The first song is considered the top result
        this.topResult = data.length > 0 ? data[0] : null;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (e) => {
        console.error(e);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  playSong(song: Song) {
    this.playerService.playSong(song, this.songs);
  }
}
