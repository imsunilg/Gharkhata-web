import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NAV } from './nav';
import { ViewportService } from '../shared/services/viewport.service';
import { AuthService } from '../core/auth/auth.service';
import { ToastHost } from '../shared/components/toast-host';
import { QuickAddLauncher } from '../features/quick-add/quick-add-launcher';
import { QuickAddSheet } from '../features/quick-add/quick-add-sheet';
import { VoiceSheet } from '../features/voice/voice-sheet';
import { VoiceService } from '../features/voice/voice.service';

@Component({
  selector: 'fem-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastHost, QuickAddLauncher, QuickAddSheet, VoiceSheet],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  protected readonly vp = inject(ViewportService);
  protected readonly auth = inject(AuthService);
  protected readonly voice = inject(VoiceService);
  protected readonly nav = NAV;
  protected readonly primary = NAV.filter((n) => n.primary);
  protected readonly moreOpen = signal(false);

  protected greetingName = () => this.auth.user()?.displayName ?? 'there';
}
