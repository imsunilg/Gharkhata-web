import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PagePlaceholder } from '../../shared/components/page-placeholder';

@Component({
  selector: 'fem-debts',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PagePlaceholder],
  template: `<fem-page-placeholder title="Debts" />`,
})
export class DebtsPage {}
