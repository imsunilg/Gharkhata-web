import { describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DonutChart } from './donut-chart';

function make(data: { label: string; value: number; colour: string }[]) {
  const fixture = TestBed.createComponent(DonutChart);
  fixture.componentRef.setInput('data', data);
  fixture.detectChanges();
  return fixture;
}

describe('DonutChart', () => {
  it('renders an empty state with no data', () => {
    const f = make([]);
    expect(f.nativeElement.textContent).toContain('No spending recorded yet');
  });

  it('renders one legend row per non-zero slice', () => {
    const f = make([
      { label: 'Food', value: 60, colour: '#e8a33d' },
      { label: 'Rent', value: 40, colour: '#6e9fe0' },
      { label: 'Zero', value: 0, colour: '#000' },
    ]);
    const rows = f.nativeElement.querySelectorAll('.legend li');
    expect(rows.length).toBe(2);
    expect(f.nativeElement.querySelector('svg').getAttribute('aria-label')).toContain('Food 60 percent');
  });
});
