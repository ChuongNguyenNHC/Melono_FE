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
  private static isInitialPathMinimal(type: 'header' | 'playlistsbar'): boolean {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname;
    if (type === 'header') {
      return path === '/login' || path === '/forget';
    } else {
      return path === '/login' || path === '/forget' || path === '/admin';
    }
  }

  protected readonly title = signal('frontend');
  protected readonly showPlaylistBar = signal(!App.isInitialPathMinimal('playlistsbar'));
  protected readonly showHeader = signal(!App.isInitialPathMinimal('header'));

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
    if (layout === 'minimal') {
      this.showPlaylistBar.set(false);
      this.showHeader.set(false);
    } else if (layout === 'admin') {
      this.showPlaylistBar.set(false);
      this.showHeader.set(true);
    } else {
      this.showPlaylistBar.set(true);
      this.showHeader.set(true);
    }
  }

  private getActiveLayout(): string | undefined {
    let snapshot = this.router.routerState.snapshot.root;

    while (snapshot.firstChild) {
      snapshot = snapshot.firstChild;
    }

    return snapshot.data['layout'];
  }
}
