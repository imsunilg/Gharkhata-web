import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PagePlaceholder } from '../../shared/components/page-placeholder';

@Component({
  selector: 'fem-reports',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PagePlaceholder],
  template: `<fem-page-placeholder title="Reports" />`,
})
export class ReportsPage {}
