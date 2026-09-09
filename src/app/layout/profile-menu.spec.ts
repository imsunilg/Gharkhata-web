import { describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ProfileMenu } from './profile-menu';
import { AuthService, formatLastLogin, initialsOf } from '../core/auth/auth.service';

function setup() {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
  });
  const auth = TestBed.inject(AuthService);
  const fixture = TestBed.createComponent(ProfileMenu);
  fixture.detectChanges();
  const el: HTMLElement = fixture.nativeElement;
  const button = () => el.querySelector<HTMLButtonElement>('.avatar-btn')!;
  const menu = () => el.querySelector('[role="menu"]');
  const click = (target: EventTarget | null) => {
    (target as HTMLElement)?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
  };
  return { fixture, auth, el, button, menu, click };
}

describe('ProfileMenu', () => {
  it('opens on click, closes on a second click, and tracks aria-expanded', () => {
    const { button, menu, click } = setup();
    expect(menu()).toBeNull();
    expect(button().getAttribute('aria-expanded')).toBe('false');
    expect(button().getAttribute('aria-haspopup')).toBe('menu');

    click(button());
    expect(menu()).not.toBeNull();
    expect(button().getAttribute('aria-expanded')).toBe('true');

    click(button());
    expect(menu()).toBeNull();
    expect(button().getAttribute('aria-expanded')).toBe('false');
  });

  it('closes on Escape', () => {
    const { fixture, button, menu, click } = setup();
    click(button());
    expect(menu()).not.toBeNull();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(menu()).toBeNull();
  });

  it('closes on an outside click', () => {
    const { button, menu, click } = setup();
    click(button());
    expect(menu()).not.toBeNull();
    click(document.body);
    expect(menu()).toBeNull();
  });

  it('shows the last-login line and falls back to a placeholder identity', () => {
    const { el, button, click } = setup();
    click(button());
    const text = el.querySelector('.last')?.textContent ?? '';
    expect(text).toContain('Last login:');
    expect(text).toMatch(/Last login: (Today|Yesterday|\d)/);
    expect(el.querySelector('.nm')?.textContent).toContain('Sunil Gadakari');
    expect(el.querySelector('.rl')?.textContent).toContain('Family Owner');
  });

  it('sign out clears the session and routes to login', () => {
    const { auth, el, button, click } = setup();
    const logout = vi.spyOn(auth, 'logout');
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    click(button());
    click(el.querySelector('.item.danger'));
    expect(logout).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/auth/login']);
  });
});

describe('profile identity helpers', () => {
  it('builds initials from the first and last name', () => {
    expect(initialsOf('Rahul Sharma')).toBe('RS');
    expect(initialsOf('  priya  ')).toBe('P');
    expect(initialsOf('')).toBe('RS');
  });

  it('labels a same-day login as "Today, <time>"', () => {
    const now = new Date('2026-09-09T14:30:00');
    const at = new Date('2026-09-09T09:42:00');
    expect(formatLastLogin(at, now)).toMatch(/^Today, /);
  });

  it('labels the previous day as "Yesterday, <time>"', () => {
    const now = new Date('2026-09-09T14:30:00');
    const at = new Date('2026-09-08T21:05:00');
    expect(formatLastLogin(at, now)).toMatch(/^Yesterday, /);
  });

  it('falls back when there is no stored login', () => {
    expect(formatLastLogin(null)).toBe('Today, 9:42 AM');
  });
});
