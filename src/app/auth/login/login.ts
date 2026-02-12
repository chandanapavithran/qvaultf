import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  loginForm: FormGroup;
  submitted = false;
  showPassword = false; // toggle for password visibility

  // Feedback message properties
  message = '';
  messageType: 'success' | 'error' = 'success';
  showMessage = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private userService: UserService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email, this.domainValidator]],
      password: ['', Validators.required]
    });
  }

  // Toggle visibility
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // Email domain validator
  domainValidator(control: AbstractControl): ValidationErrors | null {
    const email = control.value;
    return email && !email.endsWith('@kristujayanti.com') ? { invalidDomain: true } : null;
  }

  // Show message
  displayMessage(type: 'success' | 'error', text: string): void {
    this.messageType = type;
    this.message = text;
    this.showMessage = true;
    setTimeout(() => this.showMessage = false, 4000);
  }

  login() {
    this.submitted = true;
    if (this.loginForm.invalid) return;

    const { email, password } = this.loginForm.value;

    this.userService.login(email, password).subscribe({
      next: (user: any) => {
        // Assuming user object or success response
        if (user) {
          this.userService.setEmail(email);
          if (user.message === 'Login success') {
            const accessToken = user['access token'];
            const refreshToken = user['refresh token'];
            // Backend returns designation and role
            const designation = user.designation || '';
            const role = user.role || '';
            const name = user.name || (user.firstName ? `${user.firstName} ${user.lastName}` : '');

            this.userService.setSession(accessToken, refreshToken, designation, role, name);

            this.displayMessage('success', `Welcome back!`);
            setTimeout(() => this.router.navigate(['/landing']), 1000);
          } else {
            this.displayMessage('error', user.message || 'Login failed.');
          }
        } else {
          this.displayMessage('error', 'Login failed. Please check credentials.');
        }
      },
      error: (err) => {
        // Try to extract message from backend error response if available
        const errorMessage = err.error?.message || 'Invalid email or password.';
        this.displayMessage('error', errorMessage);
        console.error('Login error:', err);
      }
    });
  }
}
