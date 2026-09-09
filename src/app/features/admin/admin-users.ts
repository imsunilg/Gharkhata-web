import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, debounceTime, firstValueFrom } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminApiService } from './admin-api.service';
import { AdminActionDialog, UserAction } from './admin-action-dialog';
import { AdminRoleDialog } from './admin-role-dialog';
import { AdminUserFormDialog } from './admin-user-form-dialog';
import type { AdminFamilyListItem, AdminUserListItem, AdminUserListItemPagedResult } from '../../core/api/models';

type DialogState =
  | { kind: 'create' }
  | { kind: 'edit'; user: AdminUserListItem }
  | { kind: 'role'; user: AdminUserListItem }
  | { kind: 'action'; user: AdminUserListItem; action: UserAction };

interface Filters {
  search: string;
  status: string;
  role: string;
  familyId: string;
  dateRange: string;
  sort: string;
  direction: string;
  page: number;
  pageSize: number;
}

const STATUSES = ['All', 'Active', 'Inactive', 'Suspended', 'Deleted'];
const ROLES = ['All', 'SuperAdmin', 'Owner', 'Admin', 'Member'];
const DATE_RANGES = [
  { v: '', label: 'Any time' },
  { v: 'today', label: 'Today' },
  { v: '7d', label: 'Last 7 days' },
  { v: '30d', label: 'Last 30 days' },
];
const PAGE_SIZES = [25, 50, 100];

@Component({
  selector: 'fem-admin-users',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DatePipe, RouterLink, AdminActionDialog, AdminRoleDialog, AdminUserFormDialog],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.scss',
})
export class AdminUsersPage {
  private readonly api = inject(AdminApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly statuses = STATUSES;
  protected readonly roles = ROLES;
  protected readonly dateRanges = DATE_RANGES;
  protected readonly pageSizes = PAGE_SIZES;

  protected readonly data = signal<AdminUserListItemPagedResult | null>(null);
  protected readonly families = signal<AdminFamilyListItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);
  protected readonly dialog = signal<DialogState | null>(null);
  protected readonly openMenu = signal<string | null>(null);

  protected readonly filters = signal<Filters>({
    search: '', status: 'All', role: 'All', familyId: '', dateRange: '',
    sort: 'created', direction: 'desc', page: 1, pageSize: 25,
  });

  protected readonly rows = computed(() => this.data()?.items ?? []);
  protected readonly total = computed(() => this.data()?.totalCount ?? 0);
  protected readonly totalPages = computed(() => this.data()?.totalPages ?? 1);
  protected readonly rangeStart = computed(() =>
    this.total() === 0 ? 0 : (this.filters().page - 1) * this.filters().pageSize + 1);
  protected readonly rangeEnd = computed(() =>
    Math.min(this.filters().page * this.filters().pageSize, this.total()));
  protected readonly empty = computed(() => !this.loading() && this.rows().length === 0);

  private readonly search$ = new Subject<string>();

  constructor() {
    void this.loadFamilies();

    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((q) => {
      this.filters.set({
        search: q.get('search') ?? '',
        status: q.get('status') ?? 'All',
        role: q.get('role') ?? 'All',
        familyId: q.get('familyId') ?? '',
        dateRange: q.get('dateRange') ?? '',
        sort: q.get('sort') ?? 'created',
        direction: q.get('direction') ?? 'desc',
        page: Math.max(1, Number(q.get('page') ?? 1)),
        pageSize: PAGE_SIZES.includes(Number(q.get('pageSize'))) ? Number(q.get('pageSize')) : 25,
      });
      void this.load();
    });

    this.search$.pipe(debounceTime(300), takeUntilDestroyed()).subscribe((s) => {
      this.navigate({ search: s || null, page: 1 });
    });
  }

  protected onSearch(value: string): void {
    this.search$.next(value.trim());
  }

  protected applyFilter(patch: Partial<Filters>): void {
    this.navigate({ ...patch, page: 1 });
  }

  protected goToPage(p: number): void {
    if (p < 1 || p > this.totalPages()) return;
    this.navigate({ page: p });
  }

  protected sortBy(col: string): void {
    const f = this.filters();
    const direction = f.sort === col && f.direction === 'asc' ? 'desc' : 'asc';
    this.navigate({ sort: col, direction, page: 1 });
  }

  protected toggleMenu(id: string): void {
    this.openMenu.update((cur) => (cur === id ? null : id));
  }

  @HostListener('document:click', ['$event'])
  protected onDocClick(e: MouseEvent): void {
    if (this.openMenu() && !(e.target as HTMLElement).closest('.menu-anchor')) this.openMenu.set(null);
  }

  @HostListener('document:keydown.escape')
  protected onEsc(): void {
    this.openMenu.set(null);
  }

  protected open(state: DialogState): void {
    this.openMenu.set(null);
    this.dialog.set(state);
  }

  protected closeDialog(): void {
    this.dialog.set(null);
  }

  protected onDialogDone(): void {
    this.dialog.set(null);
    void this.load();
  }

  protected pageWindow(): number[] {
    const total = this.totalPages();
    const current = this.filters().page;
    const start = Math.max(1, Math.min(current - 2, total - 4));
    const end = Math.min(total, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  private navigate(patch: Record<string, string | number | null>): void {
    void this.router.navigate([], {
      queryParams: patch,
      queryParamsHandling: 'merge',
      relativeTo: this.route,
    });
  }

  private async loadFamilies(): Promise<void> {
    try {
      this.families.set(await firstValueFrom(this.api.families()));
    } catch {
      /* non-fatal — the family filter just stays empty */
    }
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(false);
    const f = this.filters();
    try {
      this.data.set(await firstValueFrom(this.api.users({
        search: f.search || undefined,
        status: f.status === 'All' ? undefined : f.status,
        role: f.role === 'All' ? undefined : f.role,
        familyId: f.familyId || undefined,
        dateRange: f.dateRange || undefined,
        sort: f.sort,
        direction: f.direction,
        page: f.page,
        pageSize: f.pageSize,
      })));
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }
}
