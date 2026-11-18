import { Injectable } from '@angular/core';
import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class Firebase {
  readonly app: FirebaseApp;
  readonly auth: Auth;

  constructor() {
    this.app = getApps().length > 0 ? getApps()[0] : initializeApp(environment.firebase);
    this.auth = getAuth(this.app);
  }
}
