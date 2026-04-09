import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Song } from './music.service';

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  private currentSongSubject = new BehaviorSubject<Song | null>(null);
  public currentSong$ = this.currentSongSubject.asObservable();

  private isPlayingSubject = new BehaviorSubject<boolean>(false);
  public isPlaying$ = this.isPlayingSubject.asObservable();

  public audio = new Audio();

  constructor() {
    this.audio.addEventListener('ended', () => {
      this.isPlayingSubject.next(false);
    });
    this.audio.addEventListener('play', () => {
      this.isPlayingSubject.next(true);
    });
    this.audio.addEventListener('pause', () => {
      this.isPlayingSubject.next(false);
    });
  }

  playSong(song: Song) {
    if (!song.previewUrl) {
      alert('Bài hát này không có bản nghe thử trên iTunes.');
      return;
    }
    
    // Toggle play/pause if the same song is clicked
    if (this.currentSongSubject.value?.id === song.id) {
      this.togglePlay();
      return;
    }

    this.currentSongSubject.next(song);
    this.audio.src = song.previewUrl;
    this.audio.load();
    this.audio.play().catch(e => console.error("Error playing audio", e));
  }

  togglePlay() {
    if (this.audio.paused) {
      this.audio.play().catch(e => console.error("Error playing audio", e));
    } else {
      this.audio.pause();
    }
  }
  
  setVolume(volume: number) {
      this.audio.volume = volume;
  }
}
