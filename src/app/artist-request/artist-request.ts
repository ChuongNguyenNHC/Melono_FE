import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MusicLibraryService } from '../services/music-library.service';
import { MusicGenre } from '../models/music-domain.models';

@Component({
  selector: 'app-artist-request',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './artist-request.html',
  styleUrl: './artist-request.css',
})
export class ArtistRequestPage {
  private readonly libraryService = inject(MusicLibraryService);

  stageName = '';
  genre = '';
  newGenreName = '';
  showGenreCreator = false;
  bio = '';
  submitted = false;
  readonly genres$ = this.libraryService.genres$;

  submit(): void {
    if (!this.stageName.trim() || !this.genre.trim() || !this.bio.trim()) return;

    this.libraryService.submitArtistRequest({
      userId: this.libraryService.currentUserId,
      stageName: this.stageName.trim(),
      genre: this.genre.trim(),
      bio: this.bio.trim(),
    });
    this.stageName = '';
    this.genre = '';
    this.bio = '';
    this.submitted = true;
  }

  chooseGenre(genre: MusicGenre): void {
    this.genre = genre.name;
  }

  toggleGenreCreator(): void {
    this.showGenreCreator = !this.showGenreCreator;
  }

  createGenre(): void {
    const name = this.newGenreName.trim();
    if (!name) return;

    this.libraryService.createGenre(name, 'ARTIST_REQUEST', this.libraryService.currentUserId);
    this.genre = name;
    this.newGenreName = '';
    this.showGenreCreator = false;
  }
}
