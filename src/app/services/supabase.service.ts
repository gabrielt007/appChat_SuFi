import { Injectable, inject } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Auth } from '@angular/fire/auth'; // Nota: Usamos la instancia de Firebase que creó tu compañero
import { environment } from '../../environments/environment';
import { Firebase } from './firebase'; // Asumiendo que tu compañero mantuvo este archivo

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  public readonly client: SupabaseClient;
  private readonly firebase = inject(Firebase);

  constructor() {
    this.client = createClient(environment.supabase.url, environment.supabase.anonKey);
  }

  // Esta función le dice a Supabase quién es el usuario conectado
  async setSession(): Promise<void> {
    const user = this.firebase.auth.currentUser;
    if (!user) {
      console.warn('No hay usuario de Firebase logueado');
      return;
    }

    try {
      // Obtenemos el token JWT de Firebase
      const token = await user.getIdToken();
      
      // Se lo pasamos a Supabase
      const { error } = await this.client.auth.setSession({
        access_token: token,
        refresh_token: '',
      });
      
      if (error) throw error;
      console.log('Sesión de Supabase vinculada correctamente con Firebase');
    } catch (error) {
      console.error('Error vinculando sesión con Supabase:', error);
    }
  }
}