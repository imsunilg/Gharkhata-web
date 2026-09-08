import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_BASE } from '../../core/config';
import { VoiceService } from './voice.service';
import { QuickAddService } from '../quick-add/quick-add.service';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';

type Stage = 'idle' | 'permission' | 'recording' | 'uploading' | 'review' | 'error';

interface Draft {
  amount: number | null;
  title: string | null;
  categoryId: string | null;
  categoryName: string | null;
  subCategoryId: string | null;
  date: string | null;
  paidByMemberId: string | null;
  paymentMethod: string | null;
  accountId: string | null;
}

@Component({
  selector: 'fem-voice-sheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [InrCurrencyPipe],
  templateUrl: './voice-sheet.html',
  styleUrl: './voice-sheet.scss',
})
export class VoiceSheet {
  protected readonly voice = inject(VoiceService);
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly quickAdd = inject(QuickAddService);
  private readonly toast = inject(ToastService);

  protected readonly stage = signal<Stage>('idle');
  protected readonly seconds = signal(0);
  protected readonly transcript = signal('');
  protected readonly draft = signal<Draft | null>(null);
  protected readonly confidence = signal<Record<string, number>>({});
  protected readonly errorText = signal('');
  protected readonly saving = signal(false);

  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;

  protected lowConfidence(field: string): boolean {
    return (this.confidence()[field] ?? 1) < 0.6;
  }

  protected async start(): Promise<void> {
    this.reset();
    this.stage.set('permission');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.recorder = new MediaRecorder(stream, { mimeType: this.pickMime() });
      this.chunks = [];
      this.recorder.ondataavailable = (e) => this.chunks.push(e.data);
      this.recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        void this.upload();
      };
      this.recorder.start();
      this.stage.set('recording');
      this.seconds.set(0);
      this.timer = setInterval(() => {
        this.seconds.update((s) => s + 1);
        if (this.seconds() >= 30) this.stop();
      }, 1000);
    } catch {
      this.fail('Microphone permission was denied. You can still add the expense manually.');
    }
  }

  protected stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.recorder?.stop();
  }

  private async upload(): Promise<void> {
    this.stage.set('uploading');
    const blob = new Blob(this.chunks, { type: this.chunks[0]?.type ?? 'audio/webm' });
    if (blob.size < 200) {
      this.fail("I didn't catch that. Try again, or add the expense manually.");
      return;
    }
    const form = new FormData();
    form.append('audio', blob, 'clip.webm');
    try {
      const res = await firstValueFrom(
        this.http.post<{ transcript: string; draft: Draft; confidence: Record<string, number>; warnings: string[] }>(
          `${API_BASE}/voice/transcribe`,
          form,
        ),
      );
      this.transcript.set(res.transcript);
      this.draft.set(res.draft);
      this.confidence.set(res.confidence ?? {});
      if (!res.draft?.amount) {
        // No amount — hand off to Quick Add pre-filled with everything else.
        this.openQuickAddPrefilled();
        return;
      }
      this.stage.set('review');
    } catch {
      this.fail('Transcription failed. Retry, or add the expense manually.');
    }
  }

  /** THE CONFIRMATION GATE — only this path calls POST /expenses. */
  protected async confirm(): Promise<void> {
    const d = this.draft();
    if (!d?.amount || this.saving()) return;
    this.saving.set(true);
    try {
      await firstValueFrom(
        this.api.createExpense(
          {
            amount: d.amount,
            date: d.date ?? new Date().toISOString().slice(0, 10),
            title: d.title,
            categoryId: d.categoryId,
            subCategoryId: d.subCategoryId,
            paidByMemberId: d.paidByMemberId,
            paymentMethod: d.paymentMethod ?? 'Cash',
            accountId: d.accountId,
            visibility: 'Family',
          },
          crypto.randomUUID(),
        ),
      );
      this.quickAdd.notifyChanged();
      this.toast.success(`Added ₹${d.amount} · ${d.title}`);
      this.close();
    } catch (e) {
      this.toast.error((e as { userMessage?: string })?.userMessage ?? 'Could not save. Opening manual entry.');
      this.openQuickAddPrefilled();
    } finally {
      this.saving.set(false);
    }
  }

  protected edit(): void {
    this.openQuickAddPrefilled();
  }

  protected close(): void {
    this.stop();
    this.reset();
    this.voice.close();
  }

  private openQuickAddPrefilled(): void {
    const d = this.draft();
    this.voice.close();
    this.reset();
    this.quickAdd.open('', d ? { amount: d.amount, title: d.title, categoryId: d.categoryId } : null);
  }

  private fail(message: string): void {
    if (this.timer) clearInterval(this.timer);
    this.errorText.set(message);
    this.stage.set('error');
  }

  private reset(): void {
    if (this.timer) clearInterval(this.timer);
    this.stage.set('idle');
    this.seconds.set(0);
    this.transcript.set('');
    this.draft.set(null);
    this.confidence.set({});
    this.errorText.set('');
  }

  private pickMime(): string {
    for (const m of ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']) {
      if (MediaRecorder.isTypeSupported(m)) return m;
    }
    return '';
  }

  protected openManual(): void {
    this.close();
    this.quickAdd.open();
  }
}
