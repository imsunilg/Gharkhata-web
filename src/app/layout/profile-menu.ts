import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';

/**
 * Top-right account button + dropdown for the shell header. Identity comes from
 * AuthService.profile — this component holds no user data of its own.
 */
@Component({
  selector: 'fem-profile-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="wrap">
      <button
        type="button"
        class="avatar-btn"
        [class.on]="open()"
        (click)="toggle()"
        [attr.aria-expanded]="open()"
        aria-haspopup="menu"
        [attr.aria-label]="'Account menu for ' + profile().name"
      >
        <span class="avatar" aria-hidden="true">{{ profile().initials }}</span>
      </button>

      @if (open()) {
        <div class="menu" role="menu" tabindex="-1" aria-label="Account" (keydown)="onMenuKeydown($event)">
          <div class="head">
            <span class="avatar lg" aria-hidden="true">{{ profile().initials }}</span>
            <div class="who">
              <div class="nm">{{ profile().name }}</div>
              <div class="em">{{ profile().email }}</div>
              <div class="rl">{{ profile().role }}</div>
            </div>
          </div>
          <p class="last">Last login: {{ profile().lastLogin }}</p>
          <div class="sep"></div>
          <a role="menuitem" class="item" routerLink="/settings" (click)="close()">
            <span class="ico" aria-hidden="true">👤</span>View profile
          </a>
          <a role="menuitem" class="item" routerLink="/settings" (click)="close()">
            <span class="ico" aria-hidden="true">⚙</span>Account settings
          </a>
          <button role="menuitem" type="button" class="item danger" (click)="signOut()">
            <span class="ico" aria-hidden="true">⏻</span>Sign out
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .wrap { position: relative; display: flex; }
      .avatar-btn {
        min-width: 44px;
        min-height: 44px;
        display: grid;
        place-items: center;
        background: none;
        border: none;
        padding: 0;
        cursor: pointer;
        border-radius: 50%;
      }
      .avatar-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
      .avatar {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        background: var(--surface-raised);
        border: 1px solid var(--border);
        font-weight: 600;
        font-size: 0.8rem;
        text-transform: uppercase;
        color: var(--text-primary);
      }
      .avatar-btn.on .avatar,
      .avatar-btn:hover .avatar { border-color: var(--accent); color: var(--accent-strong); }

      .menu {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        width: 264px;
        max-width: calc(100vw - 24px);
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-sheet);
        padding: 6px;
        z-index: 40;
      }
      .head { display: flex; gap: 12px; align-items: center; padding: 10px 8px 8px; }
      .avatar.lg { width: 40px; height: 40px; font-size: 0.9rem; flex-shrink: 0; }
      .who { min-width: 0; }
      .nm { font-weight: 600; font-size: 0.9rem; }
      .em { font-size: 0.78rem; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .rl { font-size: 0.72rem; color: var(--accent-strong); margin-top: 2px; }
      .last { margin: 0; padding: 4px 8px 10px; font-size: 0.74rem; color: var(--text-tertiary); }
      .sep { height: 1px; background: var(--border); margin: 2px 0 6px; }

      .item {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 8px;
        min-height: 44px;
        border: none;
        background: none;
        border-radius: var(--radius-sm);
        color: var(--text-primary);
        text-decoration: none;
        font: inherit;
        font-size: 0.88rem;
        text-align: left;
        cursor: pointer;
      }
      .item:hover { background: var(--surface-raised); }
      .item:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
      .item.danger { color: var(--negative); }
      .ico { width: 20px; text-align: center; }
    `,
  ],
})
export class ProfileMenu {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);
  protected readonly open = signal(false);
  protected readonly profile = this.auth.profile;

  protected toggle(): void {
    if (this.open()) this.close(true);
    else this.openMenu();
  }

  protected close(returnFocus = false): void {
    if (!this.open()) return;
    this.open.set(false);
    if (returnFocus) queueMicrotask(() => this.avatarButton()?.focus());
  }

  private openMenu(): void {
    this.open.set(true);
    queueMicrotask(() => this.host.nativeElement.querySelector<HTMLElement>('[role="menuitem"]')?.focus());
  }

  protected signOut(): void {
    this.close();
    this.auth.logout();
    void this.router.navigate(['/auth/login']);
  }

  protected onMenuKeydown(e: KeyboardEvent): void {
    const items = Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>('[role="menuitem"]'));
    if (items.length === 0) return;
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
    else if (e.key === 'Home') { e.preventDefault(); items[0].focus(); }
    else if (e.key === 'End') { e.preventDefault(); items[items.length - 1].focus(); }
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(e: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(e.target as Node)) this.close();
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.close(true);
  }

  private avatarButton(): HTMLButtonElement | null {
    return this.host.nativeElement.querySelector<HTMLButtonElement>('.avatar-btn');
  }
}
