import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Auth } from '../core/services/auth';
import { UserService } from '../core/services/user.service';

@Component({
    selector: 'app-landing',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './landing.html',
    styleUrl: './landing.scss'
})
export class LandingComponent {
    user: any = {
        firstName: '',
        lastName: '',
        name: '',
        email: '',
        initials: ''
    };
    homeData: any = {};
    isLoading = true;
    questionPapers: any[] = [];
    recentPapers: any[] = [];
    maxDisplay = 6;
    departments: string[] = []; // Maps to 'program'
    courseCodes: string[] = []; // Maps to 'courseids'
    coursesList: string[] = []; // Maps to 'courses'
    years: string[] = [];       // Maps to 'terms' (Exam Session)
    academicYears: string[] = []; // Maps to 'year' (Academic Year)
    types: string[] = [];       // Maps to 'types'

    // Rebuild Trigger

    showProfileMenu = false;

    constructor(private auth: Auth, private userService: UserService, private router: Router) {
        const details = this.userService.getUserDetails();
        this.user.name = details.name;
        this.user.email = details.email;
        this.user.initials = this.userService.getAvatarInitials();

        // Fallback for first/last name if needed (optional since we use full name now)
        const names = details.name.split(' ');
        this.user.firstName = names[0] || '';
        this.user.lastName = names.slice(1).join(' ') || '';
    }

    ngOnInit() {
        this.fetchHomeData();
    }

    fetchHomeData() {
        this.isLoading = true;
        this.userService.getStudentHomeData().subscribe({
            next: (data) => {
                this.homeData = data;

                // Map Recommended Papers
                this.questionPapers = (data.recommendedPapers || []).map((paper: any) => ({
                    ...paper,
                    id: paper._id,
                    title: paper.course,
                    tag: paper.courseid,
                    year: paper.year,
                    term: paper.term,
                    sem: paper.sem,
                    icon: this.getRandomIcon(paper.course),
                    color: this.getRandomColor()
                }));

                // Map Recents
                this.recentPapers = (data.recents || []).map((paper: any) => ({
                    ...paper,
                    id: paper._id,
                    title: paper.course,
                    tag: paper.courseid,
                    year: paper.year,
                    term: paper.term,
                    sem: paper.sem,
                    code: paper.courseid,
                    icon: this.getRandomIcon(paper.course),
                    color: this.getRandomColor()
                }));

                // Map Dropdowns directly from JSON arrays
                this.coursesList = data.courses || [];       // ["Cloud Computing", ...]
                this.courseCodes = data.courseids || [];     // ["21BCA2T322", ...]
                this.types = data.types || [];               // ["UG"]
                this.years = data.terms || [];               // ["End Sem", "Mid Sem"]
                this.academicYears = data.year || [];        // ["2022", "2023", "2024"]
                this.departments = data.program || [];       // ["BCA"]

                this.isLoading = false;
                console.log('Home Data:', data);
            },
            error: (err) => {
                console.error('Error fetching home data:', err);
                this.isLoading = false;
            }
        });
    }

    toggleProfileMenu() {
        this.showProfileMenu = !this.showProfileMenu;
    }

    logout() {
        this.userService.logout();
        this.router.navigate(['/login']);
    }

    // Helper for icons
    getRandomIcon(title: string): string {
        const t = (title || '').toLowerCase();
        if (t.includes('python') || t.includes('code') || t.includes('programming') || t.includes('java')) return 'terminal';
        if (t.includes('data') || t.includes('sql') || t.includes('dbms')) return 'database';
        return 'server';
    }

    // Helper for colors
    getRandomColor(): string {
        const colors = ['bg-orange-100', 'bg-blue-100', 'bg-blue-50', 'bg-purple-100', 'bg-green-100', 'bg-red-100', 'bg-yellow-100'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
}
