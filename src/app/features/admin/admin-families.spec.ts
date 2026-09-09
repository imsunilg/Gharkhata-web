import { describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { AdminFamiliesPage } from './admin-families';
import { AdminApiService } from './admin-api.service';

describe('AdminFamiliesPage', () => {
  it('lists families with member counts and a members deep-link', async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    const api = TestBed.inject(AdminApiService);
    vi.spyOn(api, 'families').mockReturnValue(of([
      { id: 'f1', name: 'The Sharmas', memberCount: 4, createdAt: '2026-09-01T00:00:00Z' },
      { id: 'f2', name: 'Patel Household', memberCount: 2, createdAt: '2026-08-01T00:00:00Z' },
    ]));
    const fixture = TestBed.createComponent(AdminFamiliesPage);
    fixture.detectChanges();
    for (let i = 0; i < 4; i++) await Promise.resolve();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('tbody tr').length).toBe(2);
    expect(el.textContent).toContain('The Sharmas');
    expect(el.textContent).toContain('Patel Household');
    const link = el.querySelector('tbody a') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toContain('familyId=f1');
  });
});
