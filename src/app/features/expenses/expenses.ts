import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { ReferenceDataStore } from '../../core/state/reference-data.store';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';
import { QuickAddService } from '../quick-add/quick-add.service';
import type { ExpenseDto, Paged } from '../../core/api/models';
import { ExpenseDetail } from './expense-detail';

@Component({
  selector: 'fem-expenses',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DatePipe, InrCurrencyPipe, ExpenseDetail],
  templateUrl: './expenses.html',
  styleUrl: './expenses.scss',
})
export class ExpensesPage {
  private readonly api = inject(ApiService);
  protected readonly reference = inject(ReferenceDataStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly quickAdd = inject(QuickAddService);

  protected readonly page = signal<Paged<ExpenseDto> | null>(null);
  protected readonly loading = signal(true);
  protected readonly selectedId = signal<string | null>(null);

  protected readonly filters = signal<{
    categoryId: string;
    memberId: string;
    paymentMethod: string;
    sort: string;
    direction: string;
    page: number;
  }>({ categoryId: '', memberId: '', paymentMethod: '', sort: 'date', direction: 'desc', page: 1 });

  protected readonly empty = computed(() => !this.loading() && (this.page()?.items.length ?? 0) === 0);

  constructor() {
    void this.reference.ensureLoaded();

    // Hydrate filters from the URL so back/refresh/share works.
    this.route.queryParamMap.subscribe((q) => {
      this.filters.update((f) => ({
        ...f,
        categoryId: q.get('categoryId') ?? '',
        memberId: q.get('memberId') ?? '',
        paymentMethod: q.get('paymentMethod') ?? '',
        sort: q.get('sort') ?? 'date',
        direction: q.get('direction') ?? 'desc',
        page: Number(q.get('page') ?? 1),
      }));
      void this.load();
    });

    effect(() => {
      this.quickAdd.changeTick();
      void this.load();
    });
  }

  protected applyFilters(): void {
    const f = this.filters();
    void this.router.navigate([], {
      queryParams: {
        categoryId: f.categoryId || null,
        memberId: f.memberId || null,
        paymentMethod: f.paymentMethod || null,
        sort: f.sort,
        direction: f.direction,
        page: 1,
      },
      queryParamsHandling: 'merge',
    });
  }

  protected goToPage(p: number): void {
    void this.router.navigate([], { queryParams: { page: p }, queryParamsHandling: 'merge' });
  }

  protected categoryColour(id: string | null | undefined): string {
    return this.reference.categoryById().get(id ?? '')?.colour ?? 'var(--cat-other)';
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    const f = this.filters();
    try {
      const result = await firstValueFrom(
        this.api.expenses({
          categoryId: f.categoryId,
          memberId: f.memberId,
          paymentMethod: f.paymentMethod,
          sort: f.sort,
          direction: f.direction,
          page: f.page,
          pageSize: 50,
        }),
      );
      this.page.set(result);
    } finally {
      this.loading.set(false);
    }
  }

  protected onDetailClosed(changed: boolean): void {
    this.selectedId.set(null);
    if (changed) void this.load();
  }
}
