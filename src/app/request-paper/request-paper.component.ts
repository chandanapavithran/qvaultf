import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { UserService } from '../core/services/user.service';
import { ToastService } from '../core/services/toast.service';

@Component({
    selector: 'app-request-paper',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './request-paper.component.html',
    styleUrls: ['./request-paper.component.scss']
})
export class RequestPaperComponent {
    user: any = {};
    showProfileMenu = false;
    isSubmitting = false;
    submitted = false; // Add submitted flag

    request = {
        name: '',
        course: '',
        code: '',
        year: '',
        sem: '',
        term: '',
        details: ''
    };

    // Helper options
    semesters = ['1', '2', '3', '4', '5', '6'];
    terms = ['Mid Sem', 'End Sem'];

    constructor(
        private userService: UserService,
        private router: Router,
        private toastService: ToastService
    ) {
        this.user = this.userService.getUserDetails();
        this.request.name = ''; // Start with an empty name as requested
    }

    toggleProfileMenu() {
        this.showProfileMenu = !this.showProfileMenu;
    }

    logout() {
        this.userService.logout();
        this.router.navigate(['/login']);
    }

    // New: Prevent non-numeric characters from being entered
    allowOnlyNumbers(event: any) {
        const input = event.target as HTMLInputElement;
        input.value = input.value.replace(/[^0-9]/g, '');
        this.request.year = input.value;
    }

    // New: Prevent non-alphabetic characters from being entered
    allowOnlyAlphabets(event: any) {
        const input = event.target as HTMLInputElement;
        // Allows only letters and spaces
        input.value = input.value.replace(/[^a-zA-Z\s]/g, '');
        this.request.name = input.value;
    }

    // Validation helpers
    isInvalid(field: keyof typeof this.request): boolean {
        const val = this.request[field];
        if (!val && field !== 'details') return true;

        if (field === 'name' && val) {
            return /\d/.test(val); // True if contains numbers
        }

        if (field === 'year' && val) {
            return !/^\d{4}$/.test(val); // True if not exactly 4 digits
        }

        return false;
    }

    getErrorMessage(field: keyof typeof this.request): string {
        const val = this.request[field];
        if (!val) return 'This field is required';

        if (field === 'name' && /\d/.test(val)) {
            return 'Name should not contain numbers';
        }

        if (field === 'year' && !/^\d{4}$/.test(val)) {
            return 'Year must be exactly 4 digits';
        }

        return '';
    }

    submitRequest() {
        this.submitted = true;

        // check if any mandatory field is invalid
        const mandatoryFields: (keyof typeof this.request)[] = ['name', 'course', 'code', 'year', 'sem', 'term'];
        const hasErrors = mandatoryFields.some(field => this.isInvalid(field));

        if (hasErrors) {
            this.toastService.show('Please fix the errors in the form.', 'error');
            return;
        }

        this.isSubmitting = true;
        console.log('Submitting Request:', this.request);

        this.userService.requestPaper(this.request).subscribe({
            next: (res: any) => {
                this.isSubmitting = false;
                if (res && res.message === 'success') {
                    this.toastService.show('Request submitted successfully!', 'success');
                    this.submitted = false; // Reset submitted state
                    this.request = {
                        name: this.user.name || '',
                        course: '',
                        code: '',
                        year: '',
                        sem: '',
                        term: '',
                        details: ''
                    };
                } else {
                    this.toastService.show('Failed to submit request. Please try again.', 'error');
                }
            },
            error: (err: any) => {
                this.isSubmitting = false;
                console.error('Request submission error:', err);
                this.toastService.show('An error occurred. Please try again later.', 'error');
            }
        });
    }
}
