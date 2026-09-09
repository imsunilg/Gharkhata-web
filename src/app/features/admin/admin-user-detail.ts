import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminApiService } from './admin-api.service';
import { AdminActionDialog, UserAction } from './admin-action-dialog';
import { AdminRoleDialog } from './admin-role-dialog';
import { AdminUserFormDialog } from './admin-user-form-dialog';
import type { AdminFamilyListItem, AdminUserDetail } from '../../core/api/models';

type DialogState =
  | { kind: 'edit' }
  | { kind: 'role' }
  | { kind: 'action'; action: UserAction };

@Component({
  selector: 'fem-admin-user-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, AdminActionDialog, AdminRoleDialog, AdminUserFormDialog],
  templateUrl: './admin-user-detail.html',
  styleUrl: './admin-user-detail.scss',
})
export class AdminUserDetailPage {
  private readonly api = inject(AdminApiService);
  private readonly route = inject(ActivatedRoute);

  protected readonly user = signal<AdminUserDetail | null>(null);
  protected readonly families = signal<AdminFamilyListItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);
  protected readonly dialog = signal<DialogState | null>(null);

  private id = '';

  protected readonly isDeleted = computed(() => !!this.user()?.isDeleted);
  protected readonly isActive = computed(() => this.user()?.status === 'Active');
  protected readonly displayRole = computed(() => {
    const u = this.user();
    return u?.platformRole ?? u?.familyRole ?? '—';
  });

  constructor() {
    void this.loadFamilies();
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((p) => {
      this.id = p.get('id') ?? '';
      void this.load();
    });
  }

  protected open(state: DialogState): void {
    this.dialog.set(state);
  }

  protected closeDialog(): void {
    this.dialog.set(null);
  }

  protected onDialogDone(): void {
    this.dialog.set(null);
    void this.load();
  }

  private async loadFamilies(): Promise<void> {
    try {
      this.families.set(await firstValueFrom(this.api.families()));
    } catch {
      /* non-fatal */
    }
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(false);
    try {
      this.user.set(await firstValueFrom(this.api.user(this.id)));
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }
}
