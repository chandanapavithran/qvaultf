import { Injectable } from '@angular/core';
import { Observable, of, timer } from 'rxjs';
import { map } from 'rxjs/operators';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'student' | 'admin';
}

@Injectable({
  providedIn: 'root',
})
export class Auth {
  constructor() { }

  login(email: string): Observable<User> {
    // Mock login - check if email contains 'admin' for role assignment
    return timer(1000).pipe(
      map(() => ({
        id: '123',
        firstName: 'Chand',
        lastName: 'User',
        email,
        role: email.includes('admin') ? 'admin' : 'student'
      }))
    );
  }

  signup(data: any): Observable<boolean> {
    return timer(1000).pipe(map(() => true));
  }

  requestReset(email: string): Observable<boolean> {
    return timer(800).pipe(map(() => true));
  }

  verifyOtp(code: string): Observable<boolean> {
    return timer(800).pipe(map(() => code === '1234'));
  }
}
