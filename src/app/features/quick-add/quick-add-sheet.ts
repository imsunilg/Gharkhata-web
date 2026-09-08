import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { QuickAddService } from './quick-add.service';
import { SmartParseService } from './smart-parse.service';
import { ReferenceDataStore } from '../../core/state/reference-data.store';
import { AuthService } from '../../core/auth/auth.service';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'fem-quick-add-sheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './quick-add-sheet.html',
  styleUrl: './quick-add-sheet.scss',
})
export class QuickAddSheet {
  protected readonly quickAdd = inject(QuickAddService);
  private readonly parser = inject(SmartParseService);
  protected readonly reference = inject(ReferenceDataStore);
  private readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  private readonly smartInput = viewChild<ElementRef<HTMLInputElement>>('smart');

  protected readonly raw = signal('');
  protected readonly amount = signal<number | null>(null);
  protected readonly title = signal('');
  protected readonly categoryId = signal<string | null>(null);
  protected readonly subCategoryId = signal<string | null>(null);
  protected readonly paidBy = signal<string | null>(null);
  protected readonly paymentMethod = signal<string>('Cash');
  protected readonly accountId = signal<string | null>(null);
  protected readonly dateChoice = signal<'today' | 'yesterday'>('today');
  protected readonly visibility = signal<'Family' | 'Personal'>('Family');
  protected readonly saving = signal(false);
  protected readonly parseHint = signal<string | null>(null);

  protected readonly canSave = computed(() => (this.amount() ?? 0) > 0 && !this.saving());

  constructor() {
    effect(() => {
      if (this.quickAdd.isOpen()) {
        void this.reference.ensureLoaded();
        this.reset();
        queueMicrotask(() => this.smartInput()?.nativeElement.focus());
      }
    });
  }


  protected onType(value: string): void {
    this.raw.set(value);
    // Runs on EVERY keystroke, synchronously, client-side — no network call.
    const p = this.parser.parse(value);
    if (p.amount !== null) this.amount.set(p.amount);
    if (p.title) this.title.set(p.title);
    if (p.date) this.dateChoice.set(p.date);

    if (p.categoryHint) {
      const cat = this.reference.activeCategories().find((c) => c.name === p.categoryHint);
      if (cat) this.categoryId.set(cat.id!);
      if (p.subCategoryHint) {
        const sub = this.reference
          .subCategories()
          .find((s) => s.categoryId === cat?.id && s.name === p.subCategoryHint);
        this.subCategoryId.set(sub?.id ?? null);
      }
    }

    const bits: string[] = [];
    if (p.amount) bits.push(`₹${p.amount}`);
    if (p.categoryHint) bits.push(p.categoryHint + (p.subCategoryHint ? ` › ${p.subCategoryHint}` : ''));
    if (p.date) bits.push(p.date);
    this.parseHint.set(bits.length ? `Detected: ${bits.join(' · ')}` : null);
  }

  protected pickCategory(id: string): void {
    this.categoryId.set(id);
    this.subCategoryId.set(null);
  }

  protected close(): void {
    this.quickAdd.close();
  }

  protected async save(): Promise<void> {
    if (!this.canSave()) return;
    this.saving.set(true);

    const otherId = this.reference.activeCategories().find((c) => c.name === 'Other')?.id ?? null;
    const category = this.categoryId() ?? otherId;
    const catName = this.reference.categoryById().get(category ?? '')?.name ?? 'Expense';

    const body = {
      amount: this.amount(),
      date: this.resolveDate(),
      title: this.title().trim() || catName,
      categoryId: category,
      subCategoryId: this.subCategoryId(),
      paidByMemberId: this.paidBy() ?? this.auth.user()?.memberId ?? null,
      paymentMethod: this.paymentMethod(),
      accountId: this.accountId(),
      visibility: this.visibility(),
    };

    const idempotencyKey = crypto.randomUUID();
    const amount = this.amount();

    // Optimistic: close now, toast with undo, let lists refetch.
    this.quickAdd.close();
    this.quickAdd.saveDefaults({
      paymentMethod: this.paymentMethod(),
      accountId: this.accountId(),
      paidByMemberId: body.paidByMemberId ?? undefined,
    });

    let undone = false;
    const toastId = this.toast.withUndo(`Added ₹${amount} · ${body.title}`, () => {
      undone = true;
    });

    try {
      await new Promise((r) => setTimeout(r, 300)); // undo grace
      if (undone) {
        this.saving.set(false);
        return;
      }
      const created = await firstValueFrom(this.api.createExpense(body, idempotencyKey));
      this.quickAdd.notifyChanged();
      void created;
    } catch (e) {
      this.toast.dismiss(toastId);
      this.toast.error(
        (e as { userMessage?: string })?.userMessage ?? 'Could not save that expense. Try again.',
      );
    } finally {
      this.saving.set(false);
    }
  }

  private resolveDate(): string {
    const d = new Date();
    if (this.dateChoice() === 'yesterday') d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }

  private reset(): void {
    const defaults = this.quickAdd.loadDefaults();
    this.raw.set(this.quickAdd.seed());
    this.amount.set(null);
    this.title.set('');
    this.categoryId.set(null);
    this.subCategoryId.set(null);
    this.paidBy.set(defaults.paidByMemberId ?? this.auth.user()?.memberId ?? null);
    this.paymentMethod.set(defaults.paymentMethod ?? 'Cash');
    this.accountId.set(defaults.accountId ?? null);
    this.dateChoice.set('today');
    this.visibility.set('Family');
    this.parseHint.set(null);
    if (this.quickAdd.seed()) this.onType(this.quickAdd.seed());

    const pre = this.quickAdd.prefill();
    if (pre) {
      if (pre['amount']) this.amount.set(Number(pre['amount']));
      if (pre['title']) this.title.set(String(pre['title']));
      if (pre['categoryId']) this.categoryId.set(String(pre['categoryId']));
    }
  }
}
