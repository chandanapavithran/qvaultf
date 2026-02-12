import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastMessage {
    message: string;
    type: 'success' | 'error' | 'info';
    id: number;
}

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    private toastsSubject = new BehaviorSubject<ToastMessage[]>([]);
    toasts$ = this.toastsSubject.asObservable();

    private counter = 0;

    show(message: string, type: 'success' | 'error' | 'info' = 'info') {
        const id = this.counter++;
        const toast: ToastMessage = { message, type, id };
        const current = this.toastsSubject.value;
        this.toastsSubject.next([...current, toast]);

        // Auto dismiss
        setTimeout(() => this.remove(id), 3000);
    }

    remove(id: number) {
        const current = this.toastsSubject.value;
        this.toastsSubject.next(current.filter(t => t.id !== id));
    }
}
