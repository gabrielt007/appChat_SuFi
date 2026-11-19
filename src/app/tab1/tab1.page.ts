import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonFooter, IonInput, IonButton, IonList, IonItem, IonLabel, IonIcon, ActionSheetController, AlertController, LoadingController } from '@ionic/angular';
import { SupabaseService } from '../services/supabase.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { send, addCircle, image, document, location } from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonFooter, IonInput, IonButton, IonList, IonItem, IonLabel, IonIcon, CommonModule, FormsModule],
})
export class Tab1Page implements OnInit, OnDestroy {
  private supabase = inject(SupabaseService);
  private actionSheetCtrl = inject(ActionSheetController);
  private alertCtrl = inject(AlertController);
  private loadingCtrl = inject(LoadingController);
  
  messages: any[] = [];
  newMessage = '';
  channel: any;
  presenceChannel: any;
  currentUserId = 'usuario-prueba-123'; 
  typingUser: string | null = null;
  typingTimeout: any;

  constructor() {
    addIcons({ send, addCircle, image, document, location });
  }

  async ngOnInit() {
    await this.loadMessages();
    this.subscribeToMessages();
    this.setupPresence();
  }

  async loadMessages() {
    const { data, error } = await this.supabase.client
      .from('messages')
      .select(`*, profiles ( display_name )`)
      .order('created_at', { ascending: true });

    if (!error) this.messages = data || [];
  }

  subscribeToMessages() {
    this.channel = this.supabase.client
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const senderId = payload.new['sender_id'];
        const displayName = senderId === 'usuario-prueba-123' ? 'Usuario de Prueba' : 'Usuario';
        
        this.messages.push({ ...payload.new, profiles: { display_name: displayName } });
        this.scrollToBottom();
      })
      .subscribe();
  }

  setupPresence() {
    this.presenceChannel = this.supabase.client.channel('room_typing', {
      config: { presence: { key: this.currentUserId } },
    });

    this.presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = this.presenceChannel.presenceState();
        const typingUsers = (Object.values(state).flat() as any[]).filter((p: any) => p.isTyping && p.user !== this.currentUserId);
        this.typingUser = typingUsers.length > 0 ? typingUsers[0].user : null;
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await this.presenceChannel.track({ user: this.currentUserId, isTyping: false });
        }
      });
  }

  onTyping() {
    this.presenceChannel.track({ user: this.currentUserId, isTyping: true });
    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.presenceChannel.track({ user: this.currentUserId, isTyping: false });
    }, 2000); 
  }

  async sendMessage() {
    if (!this.newMessage.trim()) return;
    const content = this.newMessage;
    this.newMessage = ''; 
    this.presenceChannel.track({ user: this.currentUserId, isTyping: false });

    await this.supabase.client.from('messages').insert({
      content: content,
      sender_id: this.currentUserId,
      message_type: 'text'
    });
  }

  async openAttachments() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Adjuntar',
      buttons: [
        { text: 'Cámara / Galería', icon: 'image', handler: () => this.pickImage() },
        { text: 'Documento', icon: 'document', handler: () => this.pickDocument() },
        { text: 'Ubicación', icon: 'location', handler: () => this.shareLocation() },
        { text: 'Cancelar', role: 'cancel' },
      ],
    });
    await actionSheet.present();
  }

  async pickImage() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Prompt
      });
      
      const loading = await this.loadingCtrl.create({ message: 'Subiendo imagen...' });
      await loading.present();

      const fileName = `img_${Date.now()}.jpeg`;
      const base64Data = image.base64String as string;
      
      const { error } = await this.supabase.client.storage
        .from('chat-files')
        .upload(fileName, this.base64ToBlob(base64Data, 'image/jpeg'));

      if (error) throw error;

      const { data: urlData } = this.supabase.client.storage.from('chat-files').getPublicUrl(fileName);

      await this.supabase.client.from('messages').insert({
        content: 'Imagen enviada',
        sender_id: this.currentUserId,
        message_type: 'image',
        media_url: urlData.publicUrl
      });

      await loading.dismiss();
    } catch (e) {
      console.error('Error con imagen', e);
      this.showError('No se pudo subir la imagen.');
    }
  }

  async pickDocument() {
    const fileInput = window.document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.txt,.doc,.docx';
    fileInput.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      const loading = await this.loadingCtrl.create({ message: 'Subiendo archivo...' });
      await loading.present();

      const fileName = `${Date.now()}_${file.name}`;
      const { error } = await this.supabase.client.storage.from('chat-files').upload(fileName, file);

      if (!error) {
        const { data: urlData } = this.supabase.client.storage.from('chat-files').getPublicUrl(fileName);
        await this.supabase.client.from('messages').insert({
          content: file.name,
          sender_id: this.currentUserId,
          message_type: 'file',
          media_url: urlData.publicUrl
        });
      } else {
        console.error('Error subiendo archivo:', error);
        this.showError('No se pudo subir el archivo.');
      }
      await loading.dismiss();
    };
    fileInput.click();
  }

  async shareLocation() {
    try {
      const loading = await this.loadingCtrl.create({ message: 'Obteniendo ubicación...' });
      await loading.present();
      
      const coordinates = await Geolocation.getCurrentPosition();
      await loading.dismiss();
      
      await this.supabase.client.from('messages').insert({
        content: 'Ubicación compartida',
        sender_id: this.currentUserId,
        message_type: 'location',
        lat: coordinates.coords.latitude,
        lng: coordinates.coords.longitude
      });
    } catch (e) {
      console.error(e);
      this.showError('No se pudo obtener la ubicación. Asegúrate de dar permisos al navegador.');
    }
  }

  base64ToBlob(base64: string, contentType: string): Blob {
    const byteCharacters = atob(base64);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: contentType });
  }

  async showError(message: string) {
    const alert = await this.alertCtrl.create({
      header: 'Error',
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }

  scrollToBottom() {
    setTimeout(() => {
      // CORRECCIÓN AQUÍ: Usar window.document
      const content = window.document.querySelector('ion-content');
      if (content) content.scrollToBottom(300);
    }, 100);
  }

  ngOnDestroy() {
    if (this.channel) this.supabase.client.removeChannel(this.channel);
    if (this.presenceChannel) this.supabase.client.removeChannel(this.presenceChannel);
  }
}