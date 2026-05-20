import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Header } from './header/header';
import { Playlistsbar } from './playlistsbar/playlistsbar';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, Header, Playlistsbar],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private static isInitialPathMinimal(): boolean {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname;
    return path === '/login' || path === '/forget' || path === '/admin' || path === '/artist';
  }

  protected readonly title = signal('frontend');
  protected readonly showPlaylistBar = signal(!App.isInitialPathMinimal());
  protected readonly showHeader = signal(!App.isInitialPathMinimal());

  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  ngOnInit(): void {
    this.updateLayoutVisibility();

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => this.updateLayoutVisibility());
  }

  private updateLayoutVisibility(): void {
    const layout = this.getActiveLayout();
    const isMinimal = layout === 'minimal';
    this.showPlaylistBar.set(!isMinimal);
    this.showHeader.set(!isMinimal);
  }

  private getActiveLayout(): string | undefined {
    let snapshot = this.router.routerState.snapshot.root;

    while (snapshot.firstChild) {
      snapshot = snapshot.firstChild;
    }

    return snapshot.data['layout'];
  }
}
