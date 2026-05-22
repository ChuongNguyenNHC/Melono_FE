import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  getUserRoleClass,
  getUserRoleLabel,
  getUserStatusClass,
  getUserStatusLabel,
} from '../admin-display';
import { UserRecord, UserRole, UserStatus } from '../admin.models';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.html',
})
export class AdminUsers {
  @Input() users: UserRecord[] = [];
  @Input() search = '';
  @Input() roleFilter: UserRole | 'ALL' = 'ALL';
  @Input() statusFilter: UserStatus | 'ALL' = 'ALL';
  @Input() currentPage = 0;
  @Input() pageSize = 10;
  @Input() totalElements = 0;
  @Input() totalPages = 0;

  @Output() searchChange = new EventEmitter<string>();
  @Output() roleFilterChange = new EventEmitter<UserRole | 'ALL'>();
  @Output() statusFilterChange = new EventEmitter<UserStatus | 'ALL'>();
  @Output() refresh = new EventEmitter<void>();
  @Output() openDrawer = new EventEmitter<UserRecord>();
  @Output() ban = new EventEmitter<UserRecord>();
  @Output() unban = new EventEmitter<UserRecord>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() changeRole = new EventEmitter<{ user: UserRecord; role: UserRole }>();

  readonly getUserRoleClass = getUserRoleClass;
  readonly getUserStatusClass = getUserStatusClass;
  readonly getUserRoleLabel = getUserRoleLabel;
  readonly getUserStatusLabel = getUserStatusLabel;

  trackById(_index: number, item: UserRecord): string {
    return item.id;
  }

  getMin(a: number, b: number): number {
    return Math.min(a, b);
  }

  onRoleChange(user: UserRecord, role: any): void {
    this.changeRole.emit({ user, role: role as UserRole });
  }
}
