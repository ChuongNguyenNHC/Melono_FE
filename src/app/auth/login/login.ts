import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  isLoginMode = true;
  email = '';
  password = '';

  constructor(private authService: AuthService, private router: Router) {}

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
  }

  onLogin() {
    if (this.email) {
      this.authService.login(this.email);
    } else {
      this.authService.login('guest@melono.com');
    }
    this.router.navigate(['/']);
  }
}
