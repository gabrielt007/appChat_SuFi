import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';

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

    // Forzamos token nuevo con el claim que asignaste
    await credential.user.getIdToken(true);
    
    // Creamos el perfil en Supabase (esto es una operación de escritura, no de auth)
    await this.createSupabaseProfile(credential.user.uid, email, username);
    
    return credential.user;
  }

  async login(email: string, password: string): Promise<User> {
    const credential = await signInWithEmailAndPassword(this.firebase.auth, email, password);
    // Forzamos token nuevo para que incluya 'role: authenticated'
    await credential.user.getIdToken(true);
    return credential.user;
  }

  async logout(): Promise<void> {
    await signOut(this.firebase.auth);
    await this.router.navigateByUrl('/login', { replaceUrl: true });
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