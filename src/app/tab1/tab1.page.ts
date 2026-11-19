import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonFooter, IonInput, IonButton, IonList, IonItem, IonLabel, IonIcon } from '@ionic/angular';
import { SupabaseService } from '../services/supabase.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { send, personCircle } from 'ionicons/icons';
import { Firebase } from '../services/firebase';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonFooter, IonInput, IonButton, IonList, IonItem, IonLabel, IonIcon, CommonModule, FormsModule],
})
export class Tab1Page implements OnInit, OnDestroy {
  private supabase = inject(SupabaseService);
  private firebase = inject(Firebase);
  
  messages: any[] = [];
  newMessage = '';
  channel: any;
  currentUserId: string | null = null;

  constructor() {
    addIcons({ send, personCircle });
  }

  async ngOnInit() {
    this.currentUserId = this.firebase.auth.currentUser?.uid || null;
    await this.loadMessages();
    this.subscribeToMessages();
  }

  async loadMessages() {
    const { data, error } = await this.supabase.client
      .from('messages')
      .select(`
        id,
        content,
        created_at,
        sender_id,
        profiles ( display_name )
      `)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error cargando mensajes', error);
    } else {
      this.messages = data || [];
    }
  }

  subscribeToMessages() {
    this.channel = this.supabase.client
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
        // Corrección: Usar corchetes para evitar error de TypeScript estricto
        const senderId = payload.new['sender_id'];
        
        const { data } = await this.supabase.client
          .from('profiles')
          .select('display_name')
          .eq('id', senderId)
          .single();
          
        const newMsg = {
          ...payload.new,
          profiles: { display_name: data?.display_name || 'Usuario' }
        };
        this.messages.push(newMsg);
        this.scrollToBottom();
      })
      .subscribe();
  }

  async sendMessage() {
    if (!this.newMessage.trim() || !this.currentUserId) return;

    const messageContent = this.newMessage;
    this.newMessage = ''; // Limpiar input inmediatamente

    const { error } = await this.supabase.client
      .from('messages')
      .insert({
        content: messageContent,
        sender_id: this.currentUserId,
      });

    if (error) {
      console.error('Error enviando mensajes', error);
      this.newMessage = messageContent; // Devolver el texto si falla
    }
  }

  scrollToBottom() {
    setTimeout(() => {
      const content = document.querySelector('ion-content');
      if (content) content.scrollToBottom(300);
    }, 100);
  }

  ngOnDestroy() {
    if (this.channel) {
      this.supabase.client.removeChannel(this.channel);
    }
  }
}