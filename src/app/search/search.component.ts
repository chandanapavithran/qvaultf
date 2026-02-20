import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService } from '../core/services/user.service';

@Component({
    selector: 'app-search',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './search.component.html',
    styleUrl: './search.component.scss'
})
export class SearchComponent implements OnInit {
    user: any = {
        name: '',
        email: '',
        initials: ''
    };

    showProfileMenu = false;
    papers: any[] = [];
    isLoading = false;
    showEmptyState = false;
    currentPage = 0;
    hasMorePapers = true;
    currentFilters: any = {};

    // Dropdown Data
    departments: string[] = [];
    courseCodes: string[] = [];
    coursesList: string[] = [];
    years: string[] = [];
    academicYears: string[] = [];
    types: string[] = [];
    courseError: boolean = false;

    // Local Search Inputs
    selectedSession: string = '';
    selectedCode: string = '';
    selectedCourse: string = '';
    selectedYear: string = '';

    constructor(
        private userService: UserService,
        private router: Router,
        private route: ActivatedRoute
    ) {
        const details = this.userService.getUserDetails();
        this.user.name = details.name;
        this.user.email = details.email;
        this.user.initials = this.userService.getAvatarInitials();
    }

    ngOnInit() {
        // 1. Fetch Dropdown Data (same as Landing)
        this.userService.getStudentHomeData2().subscribe({
            next: (data: any) => {
                this.coursesList = data.courses || [];
                this.types = data.types || [];

                // Initialize dependent dropdowns as empty
                if (!this.selectedCourse) {
                    this.years = [];
                    this.academicYears = [];
                }
            },
            error: (err: any) => console.error('Error fetching dropdown data:', err)
        });

        // 2. Handle Query Params & Initial Search
        this.route.queryParams.subscribe(params => {
            console.log('SearchComponent: QueryParams changed', params);
            // Pre-fill inputs from query params
            this.selectedSession = params['term'] || '';
            this.selectedCourse = params['course'] || '';
            this.selectedYear = params['year'] || '';

            // If we have a course, sync dropdowns to fill the Year/Session lists
            if (this.selectedCourse) {
                this.onDropdownChange('course');
            }

            // Always search on load
            this.showEmptyState = false;
            this.currentFilters = params;
            this.currentPage = 0;
            this.papers = []; // Clear previous results
            this.fetchPapers();
        });

        // 3. Fetch Favorites
        this.fetchFavorites();
    }

    // ✅ Dynamic Dropdown Sync
    onDropdownChange(type: string) {
        if (this.selectedCourse) this.courseError = false;

        if (type === 'course') {
            this.selectedYear = '';
            this.selectedSession = '';
            this.years = [];
            this.academicYears = [];
        }

        if (!this.selectedCourse) return;

        const filters = {
            course: this.selectedCourse,
            year: this.selectedYear,
            term: this.selectedSession
        };

        this.userService.getSearchList(filters).subscribe({
            next: (data: any) => {
                if (data.years) this.academicYears = data.years;
                if (data.terms) this.years = data.terms;
            },
            error: (err: any) => console.error('Error syncing dropdowns:', err)
        });
    }

    // Triggered by the Search Button in the new UI
    onSearch() {
        if (!this.selectedCourse) {
            this.courseError = true;
            return;
        }

        this.currentFilters = {
            term: this.selectedSession,
            course: this.selectedCourse,
            year: this.selectedYear
        };

        // Update URL
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: this.currentFilters,
            queryParamsHandling: 'merge',
        });
    }

    fetchPapers() {
        this.isLoading = true;
        this.userService.searchPapers(this.currentFilters, this.currentPage).subscribe({
            next: (data: any) => {
                this.isLoading = false;

                // Backend returns {page: "end"} if no more data
                if (!data || (Array.isArray(data) && data.length === 0) || data.page === 'end') {
                    this.hasMorePapers = false;
                    if (this.currentPage === 0) {
                        this.papers = [];
                        this.showEmptyState = true;
                    }
                } else if (Array.isArray(data)) {
                    // Helper to safely extract ID
                    const getId = (p: any) => p._id?.$oid || p._id || p.id;

                    const newPapers = data.map((paper: any) => ({
                        ...paper,
                        id: getId(paper),
                        subjectName: paper.course,
                        subjectCode: paper.courseid,
                        examType: `${paper.term} • Semester ${paper.sem}`,
                        icon: this.getRandomIcon(paper.course),
                        color: this.getRandomColor()
                    }));

                    if (this.currentPage === 0) {
                        this.papers = newPapers;
                    } else {
                        this.papers = [...this.papers, ...newPapers];
                    }

                    if (newPapers.length < 6) {
                        this.hasMorePapers = false;
                    } else {
                        this.hasMorePapers = true;
                    }
                }
            },
            error: (err: any) => {
                console.error('Error fetching papers:', err);
                this.isLoading = false;
            }
        });
    }

    loadMore() {
        this.currentPage++;
        this.fetchPapers();
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
            next: (data: any) => {
                const favs = data.favorites || data.favourites || [];
                if (favs) {
                    this.favoriteIds = new Set(favs.map((f: any) => f._id?.$oid || f._id));
                }
            },
            error: (err: any) => console.error('Error fetching favorites:', err)
        });
    }

    toggleFavorite(paper: any) {
        const id = paper.id || paper._id?.$oid || paper._id;
        if (!id) return;

        if (this.favoriteIds.has(id)) {
            // Optimistic Remove
            this.favoriteIds.delete(id);
            this.userService.removeFromFavorites(id).subscribe({
                next: () => console.log('Removed from favorites:', id),
                error: (err: any) => {
                    console.error('Error removing favorite:', err);
                    this.favoriteIds.add(id); // Revert
                }
            });
        } else {
            // Optimistic Add
            this.favoriteIds.add(id);
            this.userService.addToFavorites(id).subscribe({
                next: () => console.log('Added to favorites:', id),
                error: (err: any) => {
                    console.error('Error adding favorite:', err);
                    this.favoriteIds.delete(id); // Revert
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
        if (!id) return;

        this.userService.viewPaper(id).subscribe({
            next: (data: any) => {
                if (data && data.url) {
                    window.open(data.url, '_blank');
                } else {
                    console.error('No URL returned for paper:', id);
                }
            },
            error: (err: any) => console.error('Error viewing paper:', err)
        });
    }
}
