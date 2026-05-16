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
  protected readonly title = signal('frontend');
  protected readonly showPlaylistBar = signal(true);

  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  ngOnInit(): void {
    this.updatePlaylistVisibility();

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => this.updatePlaylistVisibility());
  }

  private updatePlaylistVisibility(): void {
    const layout = this.getActiveLayout();
    this.showPlaylistBar.set(layout !== 'minimal');
  }

  private getActiveLayout(): string | undefined {
    let snapshot = this.router.routerState.snapshot.root;

    while (snapshot.firstChild) {
      snapshot = snapshot.firstChild;
    }

    return snapshot.data['layout'];
  }
}
