import { Injectable } from '@angular/core';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  public readonly client: SupabaseClient;

  constructor() {
    // Creamos el cliente SIN funciones de autenticación para pruebas.
    // Las políticas RLS temporales permiten acceso anónimo a 'messages'.
    this.client = createClient(environment.supabase.url, environment.supabase.anonKey);
  }
}