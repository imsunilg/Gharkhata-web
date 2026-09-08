import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PagePlaceholder } from '../../shared/components/page-placeholder';

@Component({
  selector: 'fem-goals',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PagePlaceholder],
  template: `<fem-page-placeholder title="Goals" />`,
})
export class GoalsPage {}
