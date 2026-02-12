import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './signup.html',
  styleUrl: './signup.scss'
})
export class Signup {
  registerForm: FormGroup;
  submitted = false;

  // 👁️ Visibility toggles
  showPassword = false;
  showConfirmPassword = false;

  // ✅ Feedback message properties
  message = '';
  messageType: 'success' | 'error' = 'success';
  showMessage = false;

  step: number = 1;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Initial group with all controls, but validities will be managed or checked manually per step
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email, this.domainValidator]],
      password: ['', [Validators.required, Validators.minLength(6), this.passwordStrengthValidator]],
      confirmPassword: ['', Validators.required],
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['verified'] === 'true') {
        this.step = 2;
        const savedEmail = sessionStorage.getItem('signupEmail');
        if (savedEmail) {
          this.registerForm.patchValue({ email: savedEmail });
          this.registerForm.get('email')?.disable(); // Read-only in step 2
        }
      } else {
        this.step = 1;
      }
    });
  }

  // 👁️ Toggle visibility
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // ✅ Show success/error messages
  displayMessage(type: 'success' | 'error', text: string): void {
    this.messageType = type;
    this.message = text;
    this.showMessage = true;
    setTimeout(() => this.showMessage = false, 4000);
  }

  // ✅ Email domain validator
  domainValidator(control: AbstractControl): ValidationErrors | null {
    const email = control.value;
    return email && !email.endsWith('@kristujayanti.com') ? { invalidDomain: true } : null;
  }

  // ✅ Password strength validator
  passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.value;
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])/; // At least one lowercase, one uppercase, one special char
    return password && !regex.test(password) ? { weakPassword: true } : null;
  }

  // ✅ Password match validator
  passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  // ✅ Handle Form Submit based on Step
  onSubmit(): void {
    this.submitted = true;

    if (this.step === 1) {
      if (this.registerForm.get('email')?.invalid) return;
      this.sendOtp();
    } else {
      if (this.registerForm.invalid) return;
      this.register();
    }
  }

  sendOtp() {
    const email = this.registerForm.get('email')?.value;
    this.userService.generateSignupOtp(email).subscribe({
      next: (response: any) => {
        // Backend returns { "message": "OTP Sent" } or { "message": "exist" }
        if (response && response.message === 'OTP Sent') {
          sessionStorage.setItem('signupEmail', email);
          this.displayMessage('success', 'OTP sent to email successfully.');
          setTimeout(() => {
            this.router.navigate(['/otp'], { queryParams: { mode: 'signup' } });
          }, 1500);
        } else if (response && response.message === 'exist') {
          this.displayMessage('error', 'Email already registered. Please login.');
        } else {
          // Fallback
          this.displayMessage('error', response?.message || 'Unexpected error.');
        }
      },
      error: (err) => {
        console.log(err);
        this.displayMessage('error', err);
      }
    });
  }

  register() {
    const { password } = this.registerForm.getRawValue(); // getRawValue includes disabled fields
    const email = sessionStorage.getItem('signupEmail') || '';
    const otp = sessionStorage.getItem('signupOtp') || '';

    this.userService.register(email, password, otp).subscribe({
      next: (response: any) => {
        // Backend returns "success", "otp invalid", "exist", etc. wrapped in a JSON object with "message" key
        const msg = response?.message;

        if (msg === 'success') {
          sessionStorage.removeItem('signupEmail');
          sessionStorage.removeItem('signupOtp');
          this.displayMessage('success', 'Registration successful — Redirecting to login...');
          setTimeout(() => this.router.navigate(['/login']), 1500);
        } else if (msg === 'otp invalid') {
          this.displayMessage('error', 'The OTP session is invalid or expired.');
        } else if (msg === 'exist') {
          this.displayMessage('error', 'Email already registered.');
        } else if (msg === 'invalid information') {
          this.displayMessage('error', 'Invalid information provided.');
        } else {
          this.displayMessage('error', msg || 'Registration failed.');
        }
      },
      error: (err: any) => {
        this.displayMessage('error', 'Registration failed. Server error.');
        console.error('Registration error:', err);
      }
    });
  }
}
