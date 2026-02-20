import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private baseUrl = 'http://172.18.0.201:8080/qvault';

    constructor(private http: HttpClient) { }

    // ✅ Helper: Get Auth Headers
    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('accessToken');
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        });
    }

    // ✅ Login method
    login(email: string, password: string): Observable<any> {
        const body = {
            email: email,
            password: password
        };
        return this.http.post(`${this.baseUrl}/userlog`, body, { responseType: 'json' });
    }

    // ✅ Register method
    register(email: string, password: string, otp: string): Observable<any> {
        const body = {
            email: email,
            password: password,
            otp: otp
        };
        return this.http.post(`${this.baseUrl}/usersign`, body, { responseType: 'json' });
    }

    // ✅ Generate Signup OTP
    generateSignupOtp(email: string): Observable<any> {
        const body = { email: email };
        return this.http.post(`${this.baseUrl}/usersign`, body, { responseType: 'json' });
    }

    // ✅ Request Password Reset OTP
    requestPasswordResetOtp(email: string): Observable<any> {
        const body = { email: email };
        return this.http.post(`${this.baseUrl}/resetpass`, body, { responseType: 'text' });
    }

    // ✅ Confirm Password Reset
    confirmPasswordReset(email: string, otp: string, password: string): Observable<any> {
        const body = {
            email: email,
            otp: otp,
            password: password
        };
        return this.http.post(`${this.baseUrl}/resetpass`, body, { responseType: 'text' });
    }

    private userEmail: string = '';

    // ✅ Set email after login
    setEmail(email: string): void {
        this.userEmail = email;
        localStorage.setItem('userEmail', email);
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
            return username.length >= 2 ? username.slice(-2).toUpperCase() : username.toUpperCase();
        } else if (designation === 'faculty') {
            return username.length >= 2 ? username.slice(0, 2).toUpperCase() : username.toUpperCase();
        } else {
            return username.length >= 2 ? username.slice(0, 2).toUpperCase() : username.toUpperCase();
        }
    }

    private homeDataCache: any = null;

    // ✅ Get Student Home Data (with Caching)
    getStudentHomeData(): Observable<any> {
        if (this.homeDataCache) {
            return of(this.homeDataCache);
        }

        return this.http.get(`${this.baseUrl}/studenthome`, {
            headers: this.getAuthHeaders(),
            responseType: 'json'
        }).pipe(
            tap((data: any) => this.homeDataCache = data)
        );
    }

    // ✅ Clear Home Data Cache
    clearHomeCache(): void {
        this.homeDataCache = null;
    }

    // ✅ Search Papers (No Caching - Force Flush)
    // ✅ Search Papers (POST Method - Required by Backend Body)
    searchPapers(filters: any, page: number): Observable<any> {
        console.log('UserService: searchPapers called (POST)', filters);
        const body = {
            course: filters.course || '',
            code: filters.code || '',
            year: filters.year || '',
            session: filters.session || '',
            page: page
        };

        return this.http.post(`${this.baseUrl}/searchfilter`, body, {
            headers: this.getAuthHeaders(),
            responseType: 'json'
        });
    }

    // ✅ Add to Favorites
    addToFavorites(fileid: string): Observable<any> {
        this.clearHomeCache(); // Invalidate cache
        console.log('UserService: addToFavorites called with ID:', fileid);
        const body = { fileid: fileid };
        return this.http.post(`${this.baseUrl}/addFavs`, body, {
            headers: this.getAuthHeaders(),
            responseType: 'json'
        }).pipe(
            tap(res => console.log('UserService: addToFavorites success response:', res)),
            catchError(err => {
                console.error('UserService: addToFavorites failed:', err);
                throw err;
            })
        );
    }

    // ✅ Remove from Favorites
    removeFromFavorites(fileid: string): Observable<any> {
        this.clearHomeCache(); // Invalidate cache
        console.log('UserService: removeFromFavorites called with ID:', fileid);
        const body = { fileid: fileid };
        // Using POST because the backend expects a body
        return this.http.post(`${this.baseUrl}/deleteFavs`, body, {
            headers: this.getAuthHeaders(),
            responseType: 'json'
        }).pipe(
            tap(res => console.log('UserService: removeFromFavorites success response:', res)),
            catchError(err => {
                console.error('UserService: removeFromFavorites failed:', err);
                throw err;
            })
        );
    }

    // ✅ Get Favorites
    getFavorites(): Observable<any> {
        return this.http.get(`${this.baseUrl}/showFavs`, {
            headers: this.getAuthHeaders(),
            responseType: 'json'
        });
    }

    // ✅ View Paper (Get Presigned URL)
    // Note: User backend code specified 'router.get' but reads body. Body in GET is non-standard.
    // Trying POST as it's the standard way to send a body. If fails, might need backend adjust.
    viewPaper(fileid: string): Observable<any> {
        console.log('UserService: viewPaper called with ID:', fileid);
        const body = { fileid: fileid };
        return this.http.post(`${this.baseUrl}/getpdf`, body, {
            headers: this.getAuthHeaders(),
            responseType: 'json'
        }).pipe(
            tap(res => console.log('UserService: viewPaper success response:', res)),
            catchError(err => {
                console.error('UserService: viewPaper failed:', err);
                throw err;
            })
        );
    }
    // ✅ Request Paper
    requestPaper(body: any): Observable<any> {
        console.log('UserService: requestPaper called', body);
        return this.http.post(`${this.baseUrl}/requestpaper`, body, {
            headers: this.getAuthHeaders(),
            responseType: 'json'
        }).pipe(
            tap(res => console.log('UserService: requestPaper success response:', res)),
            catchError(err => {
                console.error('UserService: requestPaper failed:', err);
                throw err;
            })
        );
    }
}
