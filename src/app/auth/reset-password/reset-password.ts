import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../core/services/user.service';

@Component({
    selector: 'app-reset-password',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './reset-password.html',
    styleUrl: './reset-password.scss' // Reusing signup or forgotten password styles if possible, but creating separate if needed. Assuming SCSS exists or inline. 
    // Wait, I should create the SCSS file or just use standard styles.
    // I'll create an empty SCSS file or re-use imports.
})
export class ResetPassword {
    resetForm: FormGroup;
    submitted = false;
    showPassword = false;
    showConfirmPassword = false;

    message = '';
    messageType: 'success' | 'error' = 'success';
    showMessage = false;

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private userService: UserService
    ) {
        this.resetForm = this.fb.group({
            password: ['', [Validators.required, Validators.minLength(6), this.passwordStrengthValidator]],
            confirmPassword: ['', Validators.required]
        }, { validators: this.passwordMatchValidator });
    }

    togglePasswordVisibility(): void {
        this.showPassword = !this.showPassword;
    }

    toggleConfirmPasswordVisibility(): void {
        this.showConfirmPassword = !this.showConfirmPassword;
    }

    passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
        const password = control.value;
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])/;
        return password && !regex.test(password) ? { weakPassword: true } : null;
    }

    passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
        const password = group.get('password')?.value;
        const confirmPassword = group.get('confirmPassword')?.value;
        return password === confirmPassword ? null : { passwordMismatch: true };
    }

    displayMessage(type: 'success' | 'error', text: string): void {
        this.messageType = type;
        this.message = text;
        this.showMessage = true;
        setTimeout(() => this.showMessage = false, 4000);
    }

    resetPassword() {
        this.submitted = true;
        if (this.resetForm.invalid) return;

        const email = sessionStorage.getItem('resetEmail');
        const otp = sessionStorage.getItem('resetOtp');

        if (!email || !otp) {
            this.displayMessage('error', 'Session authentication missing. Redirecting...');
            setTimeout(() => this.router.navigate(['/forgot-password']), 2000);
            return;
        }

        const { password } = this.resetForm.value;

        this.userService.confirmPasswordReset(email, otp, password).subscribe({
            next: (responseString) => {
                try {
                    const response = JSON.parse(responseString);
                    if (response.message === 'success') {
                        this.displayMessage('success', 'Password reset successful! Redirecting to login...');
                        sessionStorage.removeItem('resetEmail');
                        sessionStorage.removeItem('resetOtp');
                        setTimeout(() => this.router.navigate(['/login']), 1500);
                    } else {
                        this.displayMessage('error', response.message || 'Update failed.');
                    }
                } catch (e) {
                    // Fallback if response is not JSON or parsing fails
                    if (responseString.includes('success')) {
                        this.displayMessage('success', 'Password reset successful! Redirecting to login...');
                        sessionStorage.removeItem('resetEmail');
                        sessionStorage.removeItem('resetOtp');
                        setTimeout(() => this.router.navigate(['/login']), 1500);
                    } else {
                        this.displayMessage('error', 'Unexpected response from server.');
                    }
                }
            },
            error: (err) => {
                this.displayMessage('error', 'Failed to reset password.');
                console.error(err);
            }
        });
    }
}
