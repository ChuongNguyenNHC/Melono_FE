import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService, User } from '../services/auth.service';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit {
  currentUser$: Observable<User | null>;
  router = inject(Router);
  private searchSubject = new Subject<string>();

  constructor(private authService: AuthService) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    // Lắng nghe sự kiện gõ phím sau mỗi 500ms
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(value => {
      const trimmedValue = value.trim();
      if (trimmedValue) {
        this.router.navigate(['/search'], { queryParams: { q: trimmedValue } });
      }
    });
  }

  onSearchInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchSubject.next(input.value);
  }

  onSearch(event: Event) {
    // Chạy lập tức khi nhấn Enter mỏi tay
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();
    if (value) {
      this.router.navigate(['/search'], { queryParams: { q: value } });
    }
  }

  logout() {
    this.authService.logout();
  }
}
