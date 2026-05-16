import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MusicGenre } from '../../models/music-domain.models';

@Component({
  selector: 'app-admin-genres',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-genres.html',
  styleUrl: './admin-genres.css',
})
export class AdminGenres {
  @Input() genres: MusicGenre[] | null = [];
  @Output() createGenre = new EventEmitter<string>();
  @Output() approveGenre = new EventEmitter<string>();
  @Output() deleteGenre = new EventEmitter<string>();

  genreName = '';

  submit(): void {
    const name = this.genreName.trim();
    if (!name) return;

    this.createGenre.emit(name);
    this.genreName = '';
  }

  canManage(genre: MusicGenre): boolean {
    return genre.createdBy === 'ARTIST_REQUEST';
  }

  sourceLabel(genre: MusicGenre): string {
    return genre.createdBy === 'ARTIST_REQUEST' ? 'Người dùng đăng ký nghệ sĩ' : 'Quản trị viên';
  }
}
