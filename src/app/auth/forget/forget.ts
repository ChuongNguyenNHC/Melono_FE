import { Component, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-forget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forget.html',
  styleUrl: './forget.css',
})
export class Forget {
  step: number = 1;

  // Form fields
  email: string = '';
  otpCode: string = '';
  newPassword: string = '';
  confirmPassword: string = '';

  // Status flags
  isSendingOtp: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  sendOtp() {
    if (!this.email || !this.email.trim()) {
      this.errorMessage = 'Vui lòng nhập địa chỉ email đăng ký.';
      this.cdr.detectChanges();
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(this.email.trim())) {
      this.errorMessage = 'Định dạng email không hợp lệ.';
      this.cdr.detectChanges();
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.isSendingOtp = true;
    this.cdr.detectChanges();

    this.authService.forgotPassword(this.email.trim()).subscribe({
      next: () => {
        this.zone.run(() => {
          this.isSendingOtp = false;
          this.successMessage = 'Mã OTP đã được gửi thành công!';
          this.cdr.detectChanges();
        });

        Swal.fire({
          title: 'Đã gửi mã OTP!',
          text: 'Mã OTP 6 số đã được gửi tới email của bạn. Vui lòng kiểm tra hộp thư (hoặc log terminal backend)!',
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
          this.isSendingOtp = false;
          this.errorMessage = err.error?.message || 'Có lỗi xảy ra khi gửi mã OTP. Vui lòng thử lại.';
          this.cdr.detectChanges();
        });
      }
    });
  }

  goToStep2() {
    if (!this.email || !this.email.trim()) {
      this.errorMessage = 'Vui lòng nhập địa chỉ email trước.';
      this.cdr.detectChanges();
      return;
    }

    if (!this.otpCode || this.otpCode.length !== 6) {
      this.errorMessage = 'Mã OTP phải gồm 6 chữ số.';
      this.cdr.detectChanges();
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.step = 2;
    this.cdr.detectChanges();
  }
  
  goBack() {
    this.errorMessage = '';
    this.successMessage = '';
    this.step = 1;
    this.cdr.detectChanges();
  }

  resetPassword() {
    if (!this.newPassword || !this.confirmPassword) {
      this.errorMessage = 'Vui lòng nhập đầy đủ mật khẩu mới và xác nhận mật khẩu.';
      this.cdr.detectChanges();
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Mật khẩu xác nhận không khớp.';
      this.cdr.detectChanges();
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;
    this.cdr.detectChanges();

    this.authService.resetPassword(this.email.trim(), this.otpCode, this.newPassword).subscribe({
      next: () => {
        this.zone.run(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        });

        Swal.fire({
          title: 'Khôi phục thành công!',
          text: 'Mật khẩu của bạn đã được thay đổi. Đang quay trở lại trang đăng nhập...',
          icon: 'success',
          timer: 2500,
          showConfirmButton: false,
          background: '#1c1c28',
          color: '#ffffff',
          iconColor: '#1ed760',
          customClass: {
            popup: 'rounded-3xl border border-white/5 shadow-2xl font-sans'
          }
        }).then(() => {
          this.zone.run(() => {
            this.router.navigate(['/login']);
          });
        });
      },
      error: (err) => {
        this.zone.run(() => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Khôi phục thất bại. Vui lòng kiểm tra lại mã OTP.';
          this.cdr.detectChanges();
        });
      }
    });
  }
}
