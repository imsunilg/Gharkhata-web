import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PagePlaceholder } from '../../shared/components/page-placeholder';

@Component({
  selector: 'fem-income',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PagePlaceholder],
  template: `<fem-page-placeholder title="Income" />`,
})
export class IncomePage {}
