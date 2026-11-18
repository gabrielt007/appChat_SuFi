import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EMPTY } from 'rxjs';
import { vi } from 'vitest';

import { AuthService } from '../../services/auth.service';

import { LoginPage } from './login.page';

describe('LoginPage', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { observeAuthState: () => EMPTY, login: vi.fn() },
        },
      ],
    });
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
