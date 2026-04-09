import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    // Thử lấy dữ liệu từ localStorage để duy trì trạng thái đăng nhập
    const storedUser = localStorage.getItem('mockUser');
    if (storedUser) {
      this.currentUserSubject.next(JSON.parse(storedUser));
    }
  }

  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  login(email: string) {
    // Mock data
    const mockUser: User = {
      id: '1',
      name: email.split('@')[0] || 'Melono User',
      email: email,
      avatarUrl: 'https://ui-avatars.com/api/?name=' + (email.split('@')[0] || 'User') + '&background=1ed760&color=fff'
    };
    
    localStorage.setItem('mockUser', JSON.stringify(mockUser));
    this.currentUserSubject.next(mockUser);
  }

  logout() {
    localStorage.removeItem('mockUser');
    this.currentUserSubject.next(null);
  }
}
