import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './header/header';
import { Playlistsbar } from './playlistsbar/playlistsbar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Playlistsbar],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('frontend');
}
