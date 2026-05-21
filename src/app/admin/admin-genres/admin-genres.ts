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
  searchQuery = '';
  currentPage = 1;
  pageSize = 5; // Set to 5 so pagination triggers easily on smaller lists

  submit(): void {
    const name = this.genreName.trim();
    if (!name) return;

    this.createGenre.emit(name);
    this.genreName = '';
    this.currentPage = 1; // Reset to page 1 after adding
  }

  get filteredGenres(): MusicGenre[] {
    const list = this.genres || [];
    const sorted = [...list].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
      const timeA = isNaN(dateA.getTime()) ? 0 : dateA.getTime();
      const timeB = isNaN(dateB.getTime()) ? 0 : dateB.getTime();
      
      if (timeA !== timeB) {
        return timeB - timeA;
      }
      return (b.id || '').localeCompare(a.id || '');
    });

    const query = this.searchQuery.trim().toLowerCase();
    if (!query) return sorted;
    return sorted.filter(g => g.name.toLowerCase().includes(query));
  }

  get paginatedGenres(): MusicGenre[] {
    const filtered = this.filteredGenres;
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return filtered.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredGenres.length / this.pageSize) || 1;
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  onSearchChange(): void {
    this.currentPage = 1;
  }

  getMin(a: number, b: number): number {
    return Math.min(a, b);
  }

  canManage(genre: MusicGenre): boolean {
    return genre.createdBy === 'ARTIST_REQUEST';
  }

  sourceLabel(genre: MusicGenre): string {
    return genre.createdBy === 'ARTIST_REQUEST' ? 'Người dùng đăng ký nghệ sĩ' : 'Quản trị viên';
  }
}
