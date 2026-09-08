import {
  ApplicationConfig,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { INTERCEPTORS } from './core/http/interceptors';
import { restoreSession } from './core/auth/session-init';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideHttpClient(withInterceptors(INTERCEPTORS)),
    provideAppInitializer(restoreSession),
    provideRouter(routes, withComponentInputBinding()),
  ],
};
