import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss'
})
export class ForgotPassword {
  forgotForm: FormGroup;
  submitted = false;

  // Feedback message properties
  message = '';
  messageType: 'success' | 'error' = 'success';
  showMessage = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private userService: UserService
  ) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email, this.domainValidator]]
    });
  }

  // Email domain validator
  domainValidator(control: AbstractControl): ValidationErrors | null {
    const email = control.value;
    return email && !email.endsWith('@kristujayanti.com') ? { invalidDomain: true } : null;
  }

  displayMessage(type: 'success' | 'error', text: string): void {
    this.messageType = type;
    this.message = text;
    this.showMessage = true;
    setTimeout(() => this.showMessage = false, 4000);
  }

  sendResetLink() {
    this.submitted = true;
    if (this.forgotForm.invalid) return;

    const email = this.forgotForm.get('email')?.value;

    this.userService.requestPasswordResetOtp(email).subscribe({
      next: (response) => {
        // Response might be text or json, assume success if no error
        sessionStorage.setItem('resetEmail', email);
        this.displayMessage('success', 'Reset link sent to your email.');
        setTimeout(() => this.router.navigate(['/otp']), 1500);
      },
      error: (err) => {
        this.displayMessage('error', 'Failed to send reset link. Please try again.');
        console.error(err);
      }
    });
  }
}
