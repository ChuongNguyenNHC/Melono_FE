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

  private shuffleSubject = new BehaviorSubject<boolean>(false);
  public isShuffle$ = this.shuffleSubject.asObservable();

  private repeatSubject = new BehaviorSubject<'none' | 'all' | 'one'>('none');
  public repeatMode$ = this.repeatSubject.asObservable();

  public audio = new Audio();
  private queue: Song[] = [];
  private currentIndex: number = -1;

  constructor() {
    this.audio.addEventListener('ended', () => {
      this.handleSongEnded();
    });
    this.audio.addEventListener('play', () => {
      this.isPlayingSubject.next(true);
    });
    this.audio.addEventListener('pause', () => {
      this.isPlayingSubject.next(false);
    });
  }

  playSong(song: Song, context?: Song[]) {
    if (!song.previewUrl) {
      alert('Bài hát này không có bản nghe thử trên iTunes.');
      return;
    }

    if (context) {
      this.queue = context;
      this.currentIndex = this.queue.findIndex(s => s.id === song.id);
    } else if (this.queue.length === 0) {
      this.queue = [song];
      this.currentIndex = 0;
    }

    // Toggle play/pause if the same song is clicked
    if (this.currentSongSubject.value?.id === song.id) {
      this.togglePlay();
      return;
    }

    this.loadAndPlay(song);
  }

  loadAndPlay(song: Song) {
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

  nextSong() {
    if (this.queue.length === 0) return;

    if (this.repeatSubject.value === 'one') {
        this.audio.currentTime = 0;
        this.audio.play();
        return;
    }

    let nextIndex = this.currentIndex + 1;

    if (this.shuffleSubject.value) {
      nextIndex = Math.floor(Math.random() * this.queue.length);
      // Try to avoid playing the same song again if possible
      if (nextIndex === this.currentIndex && this.queue.length > 1) {
        nextIndex = (nextIndex + 1) % this.queue.length;
      }
    }

    if (nextIndex >= this.queue.length) {
      if (this.repeatSubject.value === 'all') {
        nextIndex = 0;
      } else {
        // Stop at end
        this.isPlayingSubject.next(false);
        return;
      }
    }

    this.currentIndex = nextIndex;
    this.loadAndPlay(this.queue[this.currentIndex]);
  }

  previousSong() {
    if (this.queue.length === 0) return;

    // If more than 3 seconds in, just restart current song
    if (this.audio.currentTime > 3) {
      this.audio.currentTime = 0;
      return;
    }

    let prevIndex = this.currentIndex - 1;
    if (prevIndex < 0) {
      prevIndex = this.repeatSubject.value === 'all' ? this.queue.length - 1 : 0;
    }

    this.currentIndex = prevIndex;
    this.loadAndPlay(this.queue[this.currentIndex]);
  }

  toggleShuffle() {
    this.shuffleSubject.next(!this.shuffleSubject.value);
  }

  toggleRepeat() {
    const modes: ('none' | 'all' | 'one')[] = ['none', 'all', 'one'];
    const currentIdx = modes.indexOf(this.repeatSubject.value);
    const nextIdx = (currentIdx + 1) % modes.length;
    this.repeatSubject.next(modes[nextIdx]);
  }

  private handleSongEnded() {
    if (this.repeatSubject.value === 'one') {
      this.audio.currentTime = 0;
      this.audio.play();
    } else {
      this.nextSong();
    }
  }

  setVolume(volume: number) {
    this.audio.volume = volume;
  }
}
