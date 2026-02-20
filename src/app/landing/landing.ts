import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Auth } from '../core/services/auth';
import { UserService } from '../core/services/user.service';

@Component({
    selector: 'app-landing',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
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
    favoritesList: any[] = [];
    maxDisplay = 6;
    departments: string[] = []; // Maps to 'program'
    courseCodes: string[] = []; // Maps to 'courseids'
    coursesList: string[] = []; // Maps to 'courses'
    years: string[] = [];       // Maps to 'terms' (Exam Session)
    academicYears: string[] = []; // Maps to 'year' (Academic Year)
    types: string[] = [];       // Maps to 'types'

    // Rebuild Trigger

    showProfileMenu = false;

    constructor(private auth: Auth, private userService: UserService, private router: Router, private cdr: ChangeDetectorRef) {
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
        this.fetchFavorites();
    }

    fetchHomeData() {
        this.isLoading = true;
        this.userService.getStudentHomeData().subscribe({
            next: (data) => {
                this.homeData = data;

                // Helper to safely extract ID
                const getId = (p: any) => p._id?.$oid || p._id || p.id;
                console.log('DEBUG: studentHome data:', data);

                // Helper to deduplicate array by ID
                const deduplicate = (arr: any[]) => {
                    const unique = new Map();
                    arr.forEach(item => {
                        const id = getId(item);
                        if (!unique.has(id)) unique.set(id, item);
                    });
                    return Array.from(unique.values());
                };

                // Map Favorites first to establish state
                const favs = data.favourites || data.favorites || [];
                this.favoritesList = deduplicate(favs.map((paper: any) => ({
                    ...paper,
                    id: getId(paper),
                    title: paper.course,          // Keep for backward compat if needed
                    subjectName: paper.course,    // Match Favorites Component
                    tag: paper.courseid,          // Keep for backward compat
                    subjectCode: paper.courseid,  // Match Favorites Component
                    year: paper.year,
                    term: paper.term,
                    sem: paper.sem,
                    examType: `${paper.term} • Semester ${paper.sem}`, // Match Favorites Component
                    icon: this.getRandomIcon(paper.course),
                    color: this.getRandomColor()
                })));

                // Update Set for fast lookup
                this.favoriteIds = new Set(this.favoritesList.map(f => f.id));

                // Map Recommended Papers
                const recommended = (data.recommendedPapers || []).map((paper: any) => ({
                    ...paper,
                    id: getId(paper),
                    title: paper.course,
                    tag: paper.courseid,
                    year: paper.year,
                    term: paper.term,
                    sem: paper.sem,
                    icon: this.getRandomIcon(paper.course),
                    color: this.getRandomColor()
                }));
                this.questionPapers = deduplicate(recommended);

                // Map Recents
                const recents = (data.recents || []).map((paper: any) => ({
                    ...paper,
                    id: getId(paper),
                    title: paper.course,
                    tag: paper.courseid,
                    year: paper.year,
                    term: paper.term,
                    sem: paper.sem,
                    code: paper.courseid,
                    icon: this.getRandomIcon(paper.course),
                    color: this.getRandomColor()
                }));
                this.recentPapers = deduplicate(recents);

                // Map Dropdowns directly from JSON arrays
                this.coursesList = data.courses || [];       // ["Cloud Computing", ...]
                this.courseCodes = data.courseids || [];     // ["21BCA2T322", ...]
                this.types = data.types || [];               // ["UG"]
                this.years = data.terms || [];               // ["End Sem", "Mid Sem"]
                this.academicYears = data.year || [];        // ["2022", "2023", "2024"]
                this.departments = data.program || [];       // ["BCA"]

                this.isLoading = false;
                console.log('Home Data:', data);
                this.cdr.detectChanges(); // Force update
            },
            error: (err) => {
                console.error('Error fetching home data:', err);
                this.isLoading = false;
                this.cdr.detectChanges(); // Force update on error too
            }
        });
    }

    // Search Filters
    selectedSession: string = '';
    selectedCode: string = '';
    selectedCourse: string = '';
    selectedYear: string = '';

    navigateToSearch() {
        this.router.navigate(['/search'], {
            queryParams: {
                session: this.selectedSession,
                code: this.selectedCode,
                course: this.selectedCourse,
                year: this.selectedYear
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

    // Favorites Logic
    favoriteIds: Set<string> = new Set();

    fetchFavorites() {
        this.userService.getFavorites().subscribe({
            next: (data) => {
                if (data && data.favorites) {
                    const getId = (p: any) => p._id?.$oid || p._id || p.id;
                    this.favoritesList = data.favorites.map((paper: any) => ({
                        ...paper,
                        id: getId(paper),
                        title: paper.course,
                        subjectName: paper.course,
                        tag: paper.courseid,
                        subjectCode: paper.courseid,
                        year: paper.year,
                        term: paper.term,
                        sem: paper.sem,
                        examType: `${paper.term} • Semester ${paper.sem}`,
                        icon: this.getRandomIcon(paper.course),
                        color: this.getRandomColor()
                    }));
                    this.favoriteIds = new Set(this.favoritesList.map(f => f.id));
                    this.cdr.detectChanges();
                }
            },
            error: (err) => console.error('Error fetching favorites:', err)
        });
    }

    toggleFavorite(paper: any) {
        const id = paper.id || paper._id?.$oid || paper._id;
        if (!id) {
            console.error('Paper has no ID:', paper);
            return;
        }

        if (this.favoriteIds.has(id)) {
            // Optimistic Remove
            this.favoriteIds.delete(id);
            this.favoritesList = this.favoritesList.filter(f => {
                const fId = f.id || f._id?.$oid || f._id;
                return fId !== id;
            });
            this.cdr.detectChanges(); // Ensure view updates immediately

            this.userService.removeFromFavorites(id).subscribe({
                next: () => console.log('Removed from favorites:', id),
                error: (err) => {
                    console.error('Error removing favorite:', err);
                    this.favoriteIds.add(id); // Revert
                    this.favoritesList.push(paper); // Revert list
                }
            });
        } else {
            // Optimistic Add
            this.favoriteIds.add(id);
            // Add to favoritesList (ensure consistent format)
            const newFav = {
                ...paper,
                id: id,
                // Ensure specific fields if missing from 'paper' source
                title: paper.title || paper.course,
                tag: paper.tag || paper.courseid,
                year: paper.year,
                term: paper.term,
                sem: paper.sem,
                icon: paper.icon || this.getRandomIcon(paper.course),
                color: paper.color || this.getRandomColor()
            };
            this.favoritesList = [...this.favoritesList, newFav]; // Immutable update
            this.cdr.detectChanges(); // Ensure view updates immediately

            this.userService.addToFavorites(id).subscribe({
                next: () => console.log('Added to favorites:', id),
                error: (err) => {
                    console.error('Error adding favorite:', err);
                    this.favoriteIds.delete(id); // Revert
                    this.favoritesList = this.favoritesList.filter(f => f.id !== id); // Revert list
                }
            });
        }
    }

    isFavorite(paper: any): boolean {
        const id = paper.id || paper._id?.$oid || paper._id;
        return this.favoriteIds.has(id);
    }

    viewPaper(paper: any) {
        const id = paper.id || paper._id?.$oid || paper._id;
        if (!id) {
            console.error('Paper has no ID:', paper);
            return;
        }

        this.userService.viewPaper(id).subscribe({
            next: (data: any) => {
                if (data && data.url) {
                    window.open(data.url, '_blank');
                    // Refresh data after view if needed (like recents update)
                    // Optional: this.fetchHomeData();
                } else {
                    console.error('No URL returned for paper:', id);
                }
            },
            error: (err) => console.error('Error viewing paper:', err)
        });
    }
}
