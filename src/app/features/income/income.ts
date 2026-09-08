import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { QuickAddService } from '../quick-add/quick-add.service';
import { ReferenceDataStore } from '../../core/state/reference-data.store';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';
import type { IncomeDto } from '../../core/api/models';

@Component({
  selector: 'fem-income',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, FormsModule, InrCurrencyPipe],
  template: `
    <header class="head">
      <h1>Income</h1>
      <button type="button" (click)="adding.set(!adding())">{{ adding() ? 'Cancel' : '+ Add income' }}</button>
    </header>

    <div class="cards">
      <div class="card"><span class="k">This month</span><span class="v">{{ monthTotal() | inr }}</span></div>
      <div class="card"><span class="k">Entries</span><span class="v">{{ items().length }}</span></div>
    </div>

    @if (adding()) {
      <form (ngSubmit)="save()">
        <input type="number" [(ngModel)]="draft.amount" name="amount" placeholder="Amount" required />
        <select [(ngModel)]="draft.source" name="source">
          @for (s of sources; track s) {<option [value]="s">{{ s }}</option>}
        </select>
        <input type="date" [(ngModel)]="draft.date" name="date" required />
        <button type="submit">Save</button>
      </form>
    }

    <ul class="list">
      @for (i of items(); track i.id) {
        <li>
          <span class="up">↑</span>
          <div class="main"><span>{{ i.source }}</span><span class="muted">{{ i.date | date: 'dd MMM' }}</span></div>
          <span class="amt pos">{{ i.amount | inr }}</span>
        </li>
      } @empty {
        <li class="muted">No income recorded yet.</li>
      }
    </ul>
  `,
  styles: [
    `
      .head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
      h1 { font-size: 1.6rem; margin: 0; }
      .head button, form button { height: 38px; padding: 0 14px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface-raised); color: var(--text-primary); }
      .muted { color: var(--text-tertiary); }
      .cards { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
      .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px; display: flex; flex-direction: column; gap: 4px; }
      .k { font-size: 0.75rem; color: var(--text-secondary); }
      .v { font-family: var(--font-display); font-size: 1.4rem; }
      form { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
      form input, form select { height: 40px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface-raised); color: var(--text-primary); padding: 0 10px; }
      .list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
      li { display: flex; align-items: center; gap: 10px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 12px 14px; }
      .up { color: var(--positive); }
      .main { flex: 1; display: flex; flex-direction: column; }
      .amt.pos { color: var(--positive); font-variant-numeric: tabular-nums; }
    `,
  ],
})
export class IncomePage {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly quickAdd = inject(QuickAddService);
  protected readonly reference = inject(ReferenceDataStore);

  protected readonly items = signal<IncomeDto[]>([]);
  protected readonly adding = signal(false);
  protected readonly sources = ['Salary', 'Business', 'Freelance', 'Interest', 'Rental', 'Bonus', 'Other'];
  protected draft = { amount: null as number | null, source: 'Salary', date: new Date().toISOString().slice(0, 10) };

  protected readonly monthTotal = computed(() => {
    const m = new Date().toISOString().slice(0, 7);
    return this.items().filter((i) => (i.date ?? '').startsWith(m)).reduce((s, i) => s + (i.amount ?? 0), 0);
  });

  constructor() {
    void this.load();
  }

  protected async save() {
    if (!this.draft.amount || this.draft.amount <= 0) return;
    try {
      await firstValueFrom(this.api.post('/income', { ...this.draft }));
      this.toast.success('Income added');
      this.adding.set(false);
      this.draft = { amount: null, source: 'Salary', date: new Date().toISOString().slice(0, 10) };
      this.quickAdd.notifyChanged();
      await this.load();
    } catch (e) {
      this.toast.error((e as { userMessage?: string })?.userMessage ?? 'Could not add income.');
    }
  }

  private async load() {
    this.items.set(await firstValueFrom(this.api.income()));
  }
}
