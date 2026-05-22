import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-artist-request',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './artist-request.html',
  styleUrl: './artist-request.css',
})
export class ArtistRequestPage implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private userSubscription?: Subscription;

  stageName = '';
  bio = '';
  submitted = false;
  isSubmitting = false;
  alreadyRequested = false;
  existingStatus = '';
  isLoading = true;
  isLegacyUser = false;

  ngOnInit(): void {
    this.userSubscription = this.authService.currentUser$.subscribe({
      next: (user) => {
        console.log('[ArtistRequestPage] currentUser$ changed:', user);
        // Reset states reactively
        this.isLoading = true;
        this.isLegacyUser = false;
        this.alreadyRequested = false;
        this.existingStatus = '';
        this.cdr.detectChanges();

        this.checkExistingRequest(user);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  private isUuid(id: any): boolean {
    if (!id || typeof id !== 'string') return false;
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return uuidRegex.test(id);
  }

  private checkExistingRequest(user: any): void {
    console.log('[ArtistRequestPage] checking existing request for user:', user);
    if (!user) {
      console.log('[ArtistRequestPage] No user logged in, stopping loading.');
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    if (!this.isUuid(user.id)) {
      console.log('[ArtistRequestPage] Legacy mock session detected:', user.id);
      this.isLegacyUser = true;
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    const url = `http://localhost:8080/api/artist-requests/user/${user.id}`;
    console.log('[ArtistRequestPage] Fetching status from:', url);
    this.http.get<any[]>(url).subscribe({
      next: (requests) => {
        console.log('[ArtistRequestPage] Backend response:', requests);
        if (requests && Array.isArray(requests) && requests.length > 0) {
          const pending = requests.find(r => r && r.status === 'PENDING');
          const approved = requests.find(r => r && r.status === 'APPROVED');
          if (pending || approved) {
            this.alreadyRequested = true;
            this.existingStatus = pending ? 'PENDING' : 'APPROVED';
          }
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[ArtistRequestPage] Fetch error:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
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

    if (!this.isUuid(user.id)) {
      Swal.fire({
        title: 'Phiên đăng nhập không hợp lệ',
        text: 'Vui lòng đăng xuất và đăng ký/đăng nhập lại tài khoản mới để gửi yêu cầu.',
        icon: 'error',
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
        this.cdr.detectChanges();

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
        this.cdr.detectChanges();
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
