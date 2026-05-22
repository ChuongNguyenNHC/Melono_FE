import { Component, OnInit, NgZone, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { UploadService } from '../../services/upload.service';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  authService = inject(AuthService);
  uploadService = inject(UploadService);
  router = inject(Router);
  zone = inject(NgZone);
  cdr = inject(ChangeDetectorRef);

  user: User | null = null;

  // Form fields
  username: string = '';
  stageName: string = '';
  avatarUrl: string = '';
  currentPassword?: string = '';
  newPassword?: string = '';
  confirmPassword?: string = '';

  // Avatar upload file state
  selectedFile: File | null = null;
  selectedFilePreview: string | null = null;

  // Status flags
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  // Tab state to toggle between profile details and password
  activeTab: 'info' | 'password' = 'info';

  ngOnInit() {
    this.authService.currentUser$.subscribe(u => {
      this.zone.run(() => {
        this.user = u;
        if (u) {
          this.username = u.username || '';
          this.stageName = u.stageName || '';
          this.avatarUrl = u.avatarUrl || '';
        }
        this.cdr.detectChanges();
      });
    });
  }

  setTab(tab: 'info' | 'password') {
    this.activeTab = tab;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.detectChanges();
  }

  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.selectedFilePreview = reader.result as string;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  updateProfileInfo() {
    if (!this.user) return;

    if (!this.username || !this.username.trim()) {
      this.errorMessage = 'Tên hiển thị không được để trống.';
      this.cdr.detectChanges();
      return;
    }

    if (this.user.role === 'ARTIST' && (!this.stageName || !this.stageName.trim())) {
      this.errorMessage = 'Nghệ danh (Stage Name) không được để trống.';
      this.cdr.detectChanges();
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;
    this.cdr.detectChanges();

    const proceedUpdate = (finalAvatarUrl: string) => {
      const updateData: any = {
        username: this.username.trim(),
        avatarUrl: finalAvatarUrl || undefined,
      };

      if (this.user!.role === 'ARTIST') {
        updateData.stageName = this.stageName.trim();
      }

      this.authService.updateProfile(this.user!.id, updateData).subscribe({
        next: () => {
          this.zone.run(() => {
            this.isLoading = false;
            this.selectedFile = null;
            this.selectedFilePreview = null;
            this.successMessage = 'Cập nhật hồ sơ thành công!';
            this.cdr.detectChanges();
          });

          Swal.fire({
            title: 'Thành công!',
            text: 'Thông tin hồ sơ của bạn đã được cập nhật.',
            icon: 'success',
            confirmButtonText: 'Đồng ý',
            confirmButtonColor: '#1ed760',
            background: '#1c1c28',
            color: '#ffffff',
            customClass: {
              popup: 'rounded-3xl border border-white/5 shadow-2xl font-sans'
            }
          });
        },
        error: (err) => {
          this.zone.run(() => {
            this.isLoading = false;
            this.errorMessage = err.error?.message || 'Có lỗi xảy ra khi cập nhật hồ sơ.';
            this.cdr.detectChanges();
          });
        }
      });
    };

    if (this.selectedFile) {
      this.uploadService.uploadImage(this.selectedFile).subscribe({
        next: (res) => {
          this.avatarUrl = res.url;
          proceedUpdate(res.url);
        },
        error: (err) => {
          this.zone.run(() => {
            this.isLoading = false;
            this.errorMessage = 'Tải ảnh đại diện thất bại.';
            this.cdr.detectChanges();
          });
        }
      });
    } else {
      proceedUpdate(this.avatarUrl.trim());
    }
  }

  changePassword() {
    if (!this.user) return;

    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.errorMessage = 'Vui lòng điền đầy đủ các thông tin mật khẩu.';
      this.cdr.detectChanges();
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Mật khẩu xác nhận không trùng khớp.';
      this.cdr.detectChanges();
      return;
    }

    if (this.newPassword.length < 6) {
      this.errorMessage = 'Mật khẩu mới phải có ít nhất 6 ký tự.';
      this.cdr.detectChanges();
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;
    this.cdr.detectChanges();

    const updateData = {
      currentPassword: this.currentPassword,
      newPassword: this.newPassword,
    };

    this.authService.updateProfile(this.user.id, updateData).subscribe({
      next: () => {
        this.zone.run(() => {
          this.isLoading = false;
          this.successMessage = 'Đổi mật khẩu thành công!';
          this.currentPassword = '';
          this.newPassword = '';
          this.confirmPassword = '';
          this.cdr.detectChanges();
        });

        Swal.fire({
          title: 'Thành công!',
          text: 'Mật khẩu của bạn đã được thay đổi thành công.',
          icon: 'success',
          confirmButtonText: 'Đồng ý',
          confirmButtonColor: '#1ed760',
          background: '#1c1c28',
          color: '#ffffff',
          customClass: {
            popup: 'rounded-3xl border border-white/5 shadow-2xl font-sans'
          }
        });
      },
      error: (err) => {
        this.zone.run(() => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Đổi mật khẩu thất bại. Mật khẩu hiện tại chưa đúng.';
          this.cdr.detectChanges();
        });
      }
    });
  }
}
