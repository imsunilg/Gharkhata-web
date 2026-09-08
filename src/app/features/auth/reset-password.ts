import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PagePlaceholder } from '../../shared/components/page-placeholder';

@Component({
  selector: 'fem-auth-reset-password',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PagePlaceholder],
  template: `<fem-page-placeholder title="ResetPassword" />`,
})
export class ResetPasswordPage {}
