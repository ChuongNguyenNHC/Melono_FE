import { Component, NgZone, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  isMounted = false;
  isLoginMode = true;
  email = '';
  password = '';
  
  // Register fields
  regUsername = '';
  regEmail = '';
  regPassword = '';
  regConfirmPassword = '';
  
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    setTimeout(() => {
      this.isMounted = true;
      this.cdr.detectChanges();
    }, 100);
  }

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  onLogin() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Vui lòng nhập đầy đủ email và mật khẩu.';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;

    this.authService.login(this.email, this.password).subscribe({
      next: (user) => {
        this.isLoading = false;
        this.cdr.detectChanges();
        this.router.navigate([
          user.role === 'ADMIN' ? '/admin' : '/'
        ]);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Sai địa chỉ email hoặc mật khẩu.';
        this.cdr.detectChanges();
      }
    });
  }

  onRegister() {
    if (!this.regUsername || !this.regEmail || !this.regPassword || !this.regConfirmPassword) {
      this.errorMessage = 'Vui lòng nhập đầy đủ thông tin đăng ký.';
      return;
    }

    if (this.regPassword !== this.regConfirmPassword) {
      this.errorMessage = 'Mật khẩu xác nhận không khớp.';
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(this.regEmail.trim())) {
      this.errorMessage = 'Định dạng email không hợp lệ.';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;

    this.authService.register(this.regUsername, this.regEmail, this.regPassword).subscribe({
      next: () => {
        // Tắt trạng thái loading và xóa sạch các ô nhập liệu đăng ký ngay lập tức
        this.zone.run(() => {
          this.isLoading = false;
          
          // Điền sẵn email đăng ký vào khung đăng nhập
          this.email = this.regEmail;
          this.password = '';
          
          // Xóa sạch dữ liệu các ô nhập liệu của form đăng ký ngay lập tức
          this.regUsername = '';
          this.regEmail = '';
          this.regPassword = '';
          this.regConfirmPassword = '';
          
          this.cdr.detectChanges();
        });

        // Hiển thị SweetAlert thông báo đăng ký thành công
        Swal.fire({
          title: 'Đăng ký thành công!',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          background: '#1c1c28',
          color: '#ffffff',
          iconColor: '#1ed760',
          customClass: {
            popup: 'rounded-3xl border border-white/5 shadow-2xl font-sans'
          }
        }).then(() => {
          // Sau khi SweetAlert đóng, thực hiện trượt sang khung đăng nhập
          this.zone.run(() => {
            this.isLoginMode = true;
            this.cdr.detectChanges();
          });
        });
      },
      error: (err) => {
        this.zone.run(() => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Đăng ký thất bại. Email này đã tồn tại trên hệ thống.';
          this.cdr.detectChanges();
        });
      }
    });
  }
}
