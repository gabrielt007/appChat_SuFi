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

    // 1. Conectar la sesión con Supabase
    await this.supabase.setSession();

    // 2. Crear el perfil en Supabase
    await this.createSupabaseProfile(credential.user.uid, email, username);
    return credential.user;
  }

  async login(email: string, password: string): Promise<User> {
    const credential = await signInWithEmailAndPassword(this.firebase.auth, email, password);
    
    // Conectar la sesión con Supabase
    await this.supabase.setSession();
    return credential.user;
  }

  async logout(): Promise<void> {
    await signOut(this.firebase.auth);
    // Cerramos sesión en Supabase también
    await this.supabase.client.auth.signOut();
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
    // Usamos upsert para evitar errores si el perfil ya existe
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