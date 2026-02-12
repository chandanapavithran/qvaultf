import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private loginUrl = 'http://172.19.2.50:8080/qvault/userlog';
    private registerUrl = 'http://172.19.2.50:8080/qvault/usersign';
    private resetPasswordUrl = 'http://172.19.2.50:8080/qvault/resetpass';

    constructor(private http: HttpClient) { }

    // ✅ Login method
    login(email: string, password: string): Observable<any> {
        // Backend expects JSON body for login
        const body = {
            email: email,
            password: password
        };

        return this.http.post(this.loginUrl, body, {
            responseType: 'json'
        });
    }

    // ✅ Register method (Step 2: Verify OTP and Create User)
    register(email: string, password: string, otp: string): Observable<any> {
        // Backend expects JSON object in body
        const body = {
            email: email,
            password: password, // key must match 'newpass = body.getString("password")'
            otp: otp
        };

        return this.http.post(this.registerUrl, body, {
            responseType: 'json'
        });
    }

    // ✅ Generate Signup OTP (Step 1: Send OTP)
    generateSignupOtp(email: string): Observable<any> {
        // Backend logic: if otp==null && newpass==null && email!=null -> Generate/Send OTP
        const body = {
            email: email
        };

        return this.http.post(this.registerUrl, body, {
            responseType: 'json'
        });
    }

    // ✅ Reset Password method (for "Forgot Password")
    // ✅ Request Password Reset OTP (Step 1)
    requestPasswordResetOtp(email: string): Observable<any> {
        const body = {
            email: email
        };
        return this.http.post(this.resetPasswordUrl, body, {
            responseType: 'text' // Backend returns string status directly or in JSON? Code says: ctx.response().end(job.encode()); where job is {message: status}
        });
    }

    // ✅ Confirm Password Reset (Step 2)
    confirmPasswordReset(email: string, otp: string, password: string): Observable<any> {
        const body = {
            email: email,
            otp: otp,
            password: password
        };
        return this.http.post(this.resetPasswordUrl, body, {
            responseType: 'text'
        });
    }


    private userEmail: string = '';

    // ✅ Set email after login
    setEmail(email: string): void {
        this.userEmail = email;
        localStorage.setItem('userEmail', email); // Optional: persist across refresh
    }

    // ✅ Get email where needed
    getEmail(): string {
        if (!this.userEmail) {
            this.userEmail = localStorage.getItem('userEmail') || '';
        }
        return this.userEmail;
    }

    // ✅ Store Tokens & User Details
    setSession(accessToken: string, refreshToken: string, designation: string, role: string, name?: string): void {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('designation', designation);
        localStorage.setItem('role', role);
        if (name) localStorage.setItem('userName', name);
    }

    // ✅ Get Access Token
    getAccessToken(): string | null {
        return localStorage.getItem('accessToken');
    }

    getUserDetails() {
        return {
            email: this.getEmail(),
            designation: localStorage.getItem('designation') || '',
            role: localStorage.getItem('role') || '',
            name: localStorage.getItem('userName') || 'User'
        };
    }

    // ✅ Clear Session
    logout(): void {
        this.userEmail = '';
        localStorage.clear();
    }

    // ✅ Get Avatar Initials
    getAvatarInitials(): string {
        const email = this.getEmail();
        const designation = localStorage.getItem('designation')?.toLowerCase() || '';

        if (!email) return 'Q';

        const username = email.split('@')[0];

        if (designation === 'student') {
            // Last 2 characters
            return username.length >= 2 ? username.slice(-2).toUpperCase() : username.toUpperCase();
        } else if (designation === 'faculty') {
            // First 2 characters
            return username.length >= 2 ? username.slice(0, 2).toUpperCase() : username.toUpperCase();
        } else {
            // Default: First 2 characters
            return username.length >= 2 ? username.slice(0, 2).toUpperCase() : username.toUpperCase();
        }
    }

    private homeUrl = 'http://172.19.2.50:8080/qvault/studenthome';

    // ✅ Get Student Home Data
    getStudentHomeData(): Observable<any> {
        // Backend expects Authorization header which is handled by interceptor if present, 
        // OR we manually add it if no interceptor.
        // The Java code says: String auth = ctx.request().getHeader("Authorization");
        // So we need to ensure the token is sent. 
        // Assuming there's an auth interceptor or I should add it here?
        // Let's check if there is an HTTP interceptor. 
        // If not, I'll add headers here directly for now since I haven't seen an interceptor in the file list (though I didn't check core completely).
        // Safest is to add headers explicitly if no interceptor known.

        const token = this.getAccessToken();
        let headers = {};
        if (token) {
            headers = { 'Authorization': `Bearer ${token}` };
        }

        return this.http.get(this.homeUrl, {
            headers: headers,
            responseType: 'json'
        });
    }
}
