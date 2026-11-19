import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { Observable } from 'rxjs';

import { Firebase } from './firebase';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly firebase = inject(Firebase);
  private readonly router = inject(Router);
  private readonly supabase = inject(SupabaseService);

  async register(email: string, password: string): Promise<User> {
    const credential = await createUserWithEmailAndPassword(this.firebase.auth, email, password);
    const username = email.split('@')[0] || 'usuario';

    // FORZAR la actualización del token para que incluya el claim 'role: authenticated'
    // Esto es crucial para que Supabase acepte al usuario.
    await credential.user.getIdToken(true);

    // Crear el perfil en Supabase
    await this.createSupabaseProfile(credential.user.uid, email, username);
    
    return credential.user;
  }

  async login(email: string, password: string): Promise<User> {
    const credential = await signInWithEmailAndPassword(this.firebase.auth, email, password);
    // Forzamos la actualización del token también en el login para asegurar que el claim esté presente
    await credential.user.getIdToken(true);
    return credential.user;
  }

  async logout(): Promise<void> {
    await signOut(this.firebase.auth);
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  observeAuthState(): Observable<User | null> {
    return new Observable<User | null>((subscriber) => {
      const unsubscribe = onAuthStateChanged(
        this.firebase.auth,
        (user) => subscriber.next(user),
        (error: Error) => subscriber.error(error),
      );

      return unsubscribe;
    });
  }

  private async createSupabaseProfile(uid: string, email: string, username: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('profiles')
      .upsert({
        id: uid,
        email: email,
        display_name: username
      });

    if (error) {
      console.error('Error creando perfil en Supabase:', error);
    }
  }
}