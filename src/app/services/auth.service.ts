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

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly firebase = inject(Firebase);
  private readonly router = inject(Router);

  async register(email: string, password: string): Promise<User> {
    const credential = await createUserWithEmailAndPassword(this.firebase.auth, email, password);
    const username = email.split('@')[0] || 'usuario';

    this.createSupabaseProfile(credential.user.uid, username);
    return credential.user;
  }

  async login(email: string, password: string): Promise<User> {
    const credential = await signInWithEmailAndPassword(this.firebase.auth, email, password);
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

  private createSupabaseProfile(uid: string, username: string): void {
    // TODO: Insert into Supabase's public.profiles using uid as the primary key.
    // Keep this uid as the profile id so it matches the Firebase account.
    void uid;
    void username;
  }
}
