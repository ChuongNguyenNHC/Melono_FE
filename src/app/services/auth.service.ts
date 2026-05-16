import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: 'USER' | 'ARTIST' | 'ADMIN';
  avatarUrl: string;
}

interface MockAccount extends User {
  password: string;
}

export const MOCK_ACCOUNTS: MockAccount[] = [
  {
    id: 'u001',
    name: 'Nguyễn Hoàng',
    username: 'user',
    email: 'user@melono.local',
    password: 'user123',
    role: 'USER',
    avatarUrl: 'https://i.pravatar.cc/100?img=1',
  },
  {
    id: 'u002',
    name: 'Trần Minh',
    username: 'artist',
    email: 'artist@melono.local',
    password: 'artist123',
    role: 'ARTIST',
    avatarUrl: 'https://i.pravatar.cc/100?img=2',
  },
  {
    id: 'u003',
    name: 'Quản trị viên',
    username: 'admin',
    email: 'admin@melono.local',
    password: 'admin123',
    role: 'ADMIN',
    avatarUrl: 'https://ui-avatars.com/api/?name=Admin&background=1ed760&color=fff',
  },
];

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

  login(identifier: string, password: string): User | null {
    const normalized = identifier.trim().toLowerCase();
    const account = MOCK_ACCOUNTS.find(
      item =>
        (item.email.toLowerCase() === normalized || item.username.toLowerCase() === normalized) &&
        item.password === password
    );

    if (!account) {
      return null;
    }

    const mockUser: User = {
      id: account.id,
      name: account.name,
      username: account.username,
      email: account.email,
      role: account.role,
      avatarUrl: account.avatarUrl,
    };
    
    localStorage.setItem('mockUser', JSON.stringify(mockUser));
    this.currentUserSubject.next(mockUser);

    return mockUser;
  }

  logout() {
    localStorage.removeItem('mockUser');
    this.currentUserSubject.next(null);
  }
}
