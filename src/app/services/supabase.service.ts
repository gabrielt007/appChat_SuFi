import { Injectable, inject } from '@angular/core';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { environment } from '../../environments/environment';
import { Firebase } from './firebase';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  public readonly client: SupabaseClient;
  private readonly firebase = inject(Firebase);

  constructor() {
    this.client = createClient(environment.supabase.url, environment.supabase.anonKey, {
      accessToken: async () => {
        const user = this.firebase.auth.currentUser;
        if (!user) return null;
        
        // IMPORTANTE: Usar 'false' para NO forzar la actualización aquí.
        // Forzar la actualización dentro de este callback causa el bloqueo.
        return await user.getIdToken(false);
      }
    });
  }
}