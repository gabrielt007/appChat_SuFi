import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EMPTY } from 'rxjs';
import { vi } from 'vitest';

import { AuthService } from '../../services/auth.service';

import { RegistroPage } from './registro.page';

describe('RegistroPage', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RegistroPage],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { observeAuthState: () => EMPTY, register: vi.fn() },
        },
      ],
    });
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(RegistroPage);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
