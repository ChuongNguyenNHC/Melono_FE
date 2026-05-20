import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: 'USER' | 'ARTIST' | 'ADMIN';
  avatarUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/auth';

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

  login(identifier: string, password: string): Observable<User> {
    return this.http.post<any>(`${this.apiUrl}/login`, {
      username: identifier,
      password: password
    }).pipe(
      map(response => {
        const backendUser = response.user;
        const user: User = {
          id: backendUser.userId,
          name: backendUser.stageName || backendUser.username,
          username: backendUser.username,
          email: backendUser.email,
          role: backendUser.role,
          avatarUrl: backendUser.avatarUrl || 'https://ui-avatars.com/api/?name=' + backendUser.username + '&background=1ed760&color=fff',
        };
        
        localStorage.setItem('mockUser', JSON.stringify(user));
        localStorage.setItem('token', response.token);
        this.currentUserSubject.next(user);
        return user;
      })
    );
  }

  register(username: string, email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, {
      username,
      email,
      password
    });
  }

  logout() {
    localStorage.removeItem('mockUser');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
  }
}
