import { describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { AdminAuditLogsPage } from './admin-audit-logs';
import { AdminApiService } from './admin-api.service';
import type { AdminAuditEntryPagedResult } from '../../core/api/models';

const page: AdminAuditEntryPagedResult = {
  items: [
    { id: 'a1', timestamp: '2026-09-08T10:00:00Z', action: 'USER_SUSPENDED', actorEmail: 'demo@gharkhata.com', target: 'jane@t.com', oldValue: 'Active', newValue: 'Suspended', reason: 'abuse', ipAddress: '::1' },
  ],
  page: 1, pageSize: 50, totalCount: 1, totalPages: 1,
};

async function setup() {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
  });
  const api = TestBed.inject(AdminApiService);
  const spy = vi.spyOn(api, 'auditLogs').mockReturnValue(of(page));
  const nav = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  const fixture = TestBed.createComponent(AdminAuditLogsPage);
  fixture.detectChanges();
  for (let i = 0; i < 4; i++) await Promise.resolve();
  fixture.detectChanges();
  return { fixture, api, spy, nav, el: fixture.nativeElement as HTMLElement };
}

describe('AdminAuditLogsPage', () => {
  it('renders each event with actor, target and the old→new change', async () => {
    const { el } = await setup();
    expect(el.textContent).toContain('USER_SUSPENDED');
    expect(el.textContent).toContain('demo@gharkhata.com');
    expect(el.textContent).toContain('jane@t.com');
    expect(el.textContent).toContain('Active → Suspended');
    expect(el.textContent).toContain('abuse');
  });

  it('changing the action filter navigates with a query param and resets the page', async () => {
    const { el, nav } = await setup();
    const select = el.querySelector('select[aria-label="Action"]') as HTMLSelectElement;
    select.value = 'ROLE_CHANGED';
    select.dispatchEvent(new Event('change'));
    expect(nav).toHaveBeenCalledWith([], expect.objectContaining({
      queryParams: expect.objectContaining({ action: 'ROLE_CHANGED', page: 1 }),
    }));
  });
});
