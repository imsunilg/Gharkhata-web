import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthShell } from './auth-shell';
import { AuthService } from '../../core/auth/auth.service';
import { ReferenceDataStore } from '../../core/state/reference-data.store';

@Component({
  selector: 'fem-auth-create-family',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, AuthShell],
  styleUrl: './auth-forms.scss',
  template: `
    <fem-auth-shell heading="Create your family" sub="This is the shared ledger everyone contributes to">
      <form [formGroup]="form" (ngSubmit)="submit()">
        @if (formError()) {<p class="form-error" aria-live="assertive">{{ formError() }}</p>}
        <div class="field">
          <label for="name">Family name</label>
          <input id="name" formControlName="name" placeholder="e.g. The Sharmas" />
          @if (show('name')) {<span class="error">Enter a family name.</span>}
        </div>
        <div class="field">
          <label for="tz">Timezone</label>
          <select id="tz" formControlName="timezone">
            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
            <option value="Asia/Dubai">Asia/Dubai</option>
            <option value="UTC">UTC</option>
          </select>
        </div>
        <div class="field">
          <label for="msd">Month starts on day</label>
          <input id="msd" type="number" min="1" max="28" formControlName="monthStartDay" />
        </div>
        <button class="submit" type="submit" [disabled]="busy()">
          {{ busy() ? 'Creating…' : 'Create family' }}
        </button>
      </form>
    </fem-auth-shell>
  `,
})
export class CreateFamilyPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly reference = inject(ReferenceDataStore);

  protected readonly busy = signal(false);
  protected readonly formError = signal('');

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    timezone: ['Asia/Kolkata', [Validators.required]],
    monthStartDay: [1, [Validators.min(1), Validators.max(28)]],
  });

  protected show(name: string) {
    const c = this.form.get(name);
    return c && c.invalid && (c.dirty || c.touched);
  }

  protected async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.busy.set(true);
    this.formError.set('');
    try {
      const { name, timezone, monthStartDay } = this.form.getRawValue();
      await firstValueFrom(this.auth.createFamily(name, timezone, Number(monthStartDay)));
      this.reference.invalidate();
      await firstValueFrom(this.auth.loadMe());
      await this.reference.ensureLoaded();
      await this.router.navigate(['/dashboard']);
    } catch (e) {
      this.formError.set((e as { userMessage?: string })?.userMessage ?? 'Could not create the family.');
    } finally {
      this.busy.set(false);
    }
  }
}
