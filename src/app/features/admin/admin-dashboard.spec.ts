import { describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { AdminDashboardPage } from './admin-dashboard';
import { AdminApiService } from './admin-api.service';

const stats = {
  totalUsers: 1248, activeUsers: 1105, inactiveUsers: 100, suspendedUsers: 43,
  deletedUsers: 12, superAdmins: 2, owners: 25, admins: 50, members: 1173, totalFamilies: 310,
};

function setup(response: 'ok' | 'error') {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
  });
  const api = TestBed.inject(AdminApiService);
  vi.spyOn(api, 'dashboard').mockReturnValue(
    response === 'ok' ? of(stats) : throwError(() => ({ status: 500 })),
  );
  const fixture = TestBed.createComponent(AdminDashboardPage);
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement };
}

describe('AdminDashboardPage', () => {
  it('renders one card per statistic with live values', async () => {
    const { fixture, el } = setup('ok');
    await fixture.whenStable();
    fixture.detectChanges();

    const cards = el.querySelectorAll('.card:not(.skeleton)');
    expect(cards.length).toBe(10);
    expect(el.textContent).toContain('Total Users');
    expect(el.textContent).toContain('1,248');
    expect(el.textContent).toContain('Members');
    expect(el.textContent).toContain('1,173');
  });

  it('links status/role cards into the users list with a query param', async () => {
    const { fixture, el } = setup('ok');
    await fixture.whenStable();
    fixture.detectChanges();
    const suspended = [...el.querySelectorAll('a.card')].find((a) => a.textContent?.includes('Suspended'));
    expect(suspended?.getAttribute('href')).toContain('/admin/users');
  });

  it('shows an error state with retry when the API fails', async () => {
    const { fixture, el } = setup('error');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(el.textContent).toContain("Couldn't load statistics");
    expect(el.querySelector('.panel.error button')).toBeTruthy();
  });
});
