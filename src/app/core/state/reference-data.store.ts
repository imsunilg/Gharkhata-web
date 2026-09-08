import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_BASE } from '../config';
import type {
  AccountDto,
  CategoryDto,
  MemberDto,
  ReferenceDataResponse,
  SubCategoryDto,
} from '../api/models';

@Injectable({ providedIn: 'root' })
export class ReferenceDataStore {
  private readonly http = inject(HttpClient);

  private readonly _categories = signal<CategoryDto[]>([]);
  private readonly _subCategories = signal<SubCategoryDto[]>([]);
  private readonly _accounts = signal<AccountDto[]>([]);
  private readonly _members = signal<MemberDto[]>([]);
  private readonly _paymentMethods = signal<string[]>([]);
  private readonly _loaded = signal(false);
  private inFlight: Promise<void> | null = null;

  readonly categories = this._categories.asReadonly();
  readonly subCategories = this._subCategories.asReadonly();
  readonly accounts = this._accounts.asReadonly();
  readonly members = this._members.asReadonly();
  readonly paymentMethods = this._paymentMethods.asReadonly();
  readonly loaded = this._loaded.asReadonly();

  readonly activeCategories = computed(() => this._categories().filter((c) => !c.isArchived));
  readonly categoryById = computed(
    () => new Map(this._categories().map((c) => [c.id!, c] as const)),
  );
  readonly memberById = computed(() => new Map(this._members().map((m) => [m.id!, m] as const)));

  async ensureLoaded(): Promise<void> {
    if (this._loaded()) return;
    this.inFlight ??= this.load();
    await this.inFlight;
  }

  invalidate(): void {
    this._loaded.set(false);
    this.inFlight = null;
  }

  private async load(): Promise<void> {
    const data = await firstValueFrom(
      this.http.get<ReferenceDataResponse>(`${API_BASE}/reference-data`),
    );
    this._categories.set(data.categories ?? []);
    this._subCategories.set(data.subCategories ?? []);
    this._accounts.set(data.accounts ?? []);
    this._members.set(data.members ?? []);
    this._paymentMethods.set(data.paymentMethods ?? []);
    this._loaded.set(true);
  }
}
