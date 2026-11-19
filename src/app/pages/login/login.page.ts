import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonButton, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonSpinner, IonText, IonTitle, IonToolbar,
} from '@ionic/angular';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [
    IonButton, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonSpinner, IonText, IonTitle, IonToolbar, ReactiveFormsModule, RouterLink,
  ],
})
export class LoginPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  loading = false;
  errorMessage = '';

  async submit(): Promise<void> {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    try {
      const { email, password } = this.form.getRawValue();
      
      // 1. Login en Firebase (esto ya fuerza el token con el claim)
      await this.auth.login(email, password);
      
      // 2. Pausa de 1 segundo para que Firebase y Supabase se estabilicen
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 3. Navegar al chat
      await this.router.navigateByUrl('/tabs/tab1', { replaceUrl: true });
      
    } catch (error: unknown) {
      this.errorMessage = this.getErrorMessage(error);
    } finally {
      this.loading = false;
    }
  }

  private getErrorMessage(error: unknown): string {
    const code = typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string' ? error.code : undefined;
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Correo o contraseña incorrectos.';
      case 'auth/invalid-email':
        return 'El correo electrónico no es válido.';
      case 'auth/too-many-requests':
        return 'Demasiados intentos. Inténtalo de nuevo más tarde.';
      default:
        return 'No se pudo iniciar sesión. Inténtalo de nuevo.';
    }
  }
}