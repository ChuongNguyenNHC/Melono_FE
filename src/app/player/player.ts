import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayerService } from '../services/player.service';

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player.html',
  styleUrl: './player.css'
})
export class PlayerComponent {
  @Input() isExpanded = true;
  playerService = inject(PlayerService);
  
  togglePlay() {
    this.playerService.togglePlay();
  }
}
