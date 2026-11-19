import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonFooter, IonInput, IonButton, IonList, IonItem, IonLabel, IonIcon } from '@ionic/angular';
import { SupabaseService } from '../services/supabase.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { send, personCircle } from 'ionicons/icons';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonFooter, IonInput, IonButton, IonList, IonItem, IonLabel, IonIcon, CommonModule, FormsModule],
})
export class Tab1Page implements OnInit, OnDestroy {
  private supabase = inject(SupabaseService);
  
  messages: any[] = [];
  newMessage = '';
  channel: any;
  currentUserId = 'usuario-prueba-123'; 

  constructor() {
    addIcons({ send, personCircle });
  }

  async ngOnInit() {
    console.log('1. Iniciando Tab1Page');
    await this.loadMessages();
    this.subscribeToMessages();
  }

  async loadMessages() {
    console.log('2. Consultando Supabase...');
    try {
      const { data, error } = await this.supabase.client
        .from('messages')
        .select(`id, content, created_at, sender_id, profiles ( display_name )`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error en Supabase:', error);
      } else {
        console.log('Mensajes obtenidos:', data);
        this.messages = data || [];
        this.scrollToBottom();
      }
    } catch (e) {
      console.error('Error inesperado:', e);
    }
  }

  subscribeToMessages() {
    this.channel = this.supabase.client
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
        const senderId = payload.new['sender_id'];
        let displayName = senderId === 'usuario-prueba-123' ? 'Usuario de Prueba' : 'Usuario';
        
        const newMsg = {
          ...payload.new,
          profiles: { display_name: displayName }
        };
        this.messages.push(newMsg);
        this.scrollToBottom();
      })
      .subscribe();
  }

  async sendMessage() {
    if (!this.newMessage.trim()) return;

    const messageContent = this.newMessage;
    this.newMessage = ''; 

    const { error } = await this.supabase.client
      .from('messages')
      .insert({
        content: messageContent,
        sender_id: this.currentUserId,
      });

    if (error) {
      console.error('Error enviando:', error);
      this.newMessage = messageContent; 
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