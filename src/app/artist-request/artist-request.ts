import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-artist-request',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './artist-request.html',
  styleUrl: './artist-request.css',
})
export class ArtistRequestPage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  stageName = '';
  bio = '';
  submitted = false;
  isSubmitting = false;
  alreadyRequested = false;
  existingStatus = '';
  isLoading = true;

  ngOnInit(): void {
    this.checkExistingRequest();
  }

  private checkExistingRequest(): void {
    const user = this.authService.currentUserValue;
    if (!user) {
      this.isLoading = false;
      return;
    }

    this.http.get<any[]>(`http://localhost:8080/api/artist-requests/user/${user.id}`).subscribe({
      next: (requests) => {
        if (requests && requests.length > 0) {
          const pending = requests.find(r => r.status === 'PENDING');
          const approved = requests.find(r => r.status === 'APPROVED');
          if (pending || approved) {
            this.alreadyRequested = true;
            this.existingStatus = pending ? 'PENDING' : 'APPROVED';
          }
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  submit(): void {
    if (!this.stageName.trim() || !this.bio.trim()) return;

    const user = this.authService.currentUserValue;
    if (!user) {
      Swal.fire({
        title: 'Chưa đăng nhập',
        text: 'Bạn cần đăng nhập để gửi yêu cầu đăng ký nghệ sĩ.',
        icon: 'warning',
        background: '#1c1c28',
        color: '#ffffff',
        confirmButtonColor: '#1ed760',
      });
      return;
    }

    this.isSubmitting = true;

    const payload = {
      userId: user.id,
      stageName: this.stageName.trim(),
      bio: this.bio.trim(),
    };

    this.http.post<any>('http://localhost:8080/api/artist-requests', payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.submitted = true;
        this.alreadyRequested = true;
        this.existingStatus = 'PENDING';
        this.stageName = '';
        this.bio = '';

        Swal.fire({
          title: 'Đã gửi yêu cầu!',
          text: 'Hồ sơ nghệ sĩ của bạn đã được gửi thành công. Quản trị viên sẽ duyệt trong thời gian sớm nhất.',
          icon: 'success',
          background: '#1c1c28',
          color: '#ffffff',
          confirmButtonColor: '#1ed760',
          timer: 3000,
          timerProgressBar: true,
        });
      },
      error: (err) => {
        this.isSubmitting = false;
        const msg = err.error?.message || err.error || 'Không thể gửi yêu cầu. Vui lòng thử lại.';
        Swal.fire({
          title: 'Gửi yêu cầu thất bại!',
          text: msg,
          icon: 'error',
          background: '#1c1c28',
          color: '#ffffff',
          confirmButtonColor: '#1ed760',
        });
      },
    });
  }
}
