import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Auth } from '../../core/services/auth'; // Keeping valid for now if other things need it, but removing usage
// actually I should remove it if not used.
// But check constructor.

import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-otp',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './otp.html',
  styleUrl: './otp.scss'
})
export class Otp {
  otpDigits: string[] = ['', '', '', '', '', '']; // 6 digits for backend compatibility
  mode: 'signup' | 'reset' = 'reset';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private toast: ToastService
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.mode = params['mode'] === 'signup' ? 'signup' : 'reset';
    });
  }

  get otpCode(): string {
    return this.otpDigits.join('');
  }

  // Handle keyboard events for OTP
  onKeyDown(index: number, event: KeyboardEvent) {
    const key = event.key;

    // Navigation (Arrows)
    if (key === 'ArrowLeft') {
      event.preventDefault();
      if (index > 0) this.focusInput(index - 1);
      return;
    }
    if (key === 'ArrowRight') {
      event.preventDefault();
      if (index < 5) this.focusInput(index + 1);
      return;
    }

    // Handle Backspace
    if (key === 'Backspace') {
      if (!this.otpDigits[index] && index > 0) {
        // If current is empty, move prev and clear that one too (optional UX choice, usually helps)
        // Or just move prev
        event.preventDefault();
        this.focusInput(index - 1);
      } else {
        // Clear current value
        this.otpDigits[index] = '';
      }
      return;
    }

    // Handle Digits (0-9)
    if (/^[0-9]$/.test(key)) {
      event.preventDefault(); // Prevent double entry since we set manually
      this.otpDigits[index] = key;

      // Move to next
      if (index < 5) {
        this.focusInput(index + 1);
      }
      return;
    }

    // Allow Tab, Delete, etc.
    if (['Tab', 'Delete', 'Enter'].includes(key)) {
      return;
    }

    // Block other keys
    event.preventDefault();
  }

  // Helper to focus input
  focusInput(index: number) {
    setTimeout(() => {
      const input = document.getElementById(`otp-${index}`);
      input?.focus();
    }, 10);
  }

  verifyOtp() {
    const code = this.otpCode;
    if (code.length !== 6) {
      this.toast.show('Please enter 6 digits', 'error');
      return;
    }

    if (this.mode === 'signup') {
      // For signup, we trust the code entered by user to send to backend in next step
      sessionStorage.setItem('signupOtp', code);
      this.router.navigate(['/signup'], { queryParams: { verified: 'true' } });
    } else {
      // Reset flow: Store OTP and verify with password in next step
      sessionStorage.setItem('resetOtp', code);
      this.toast.show('OTP Captured', 'info'); // Optional feedback
      this.router.navigate(['/reset-password']);
    }
  }

  resendCode() {
    this.toast.show('Code resent!', 'info');
    if (this.mode === 'signup') {
      // Route back to signup step 1
      this.router.navigate(['/signup']);
    }
  }
}
