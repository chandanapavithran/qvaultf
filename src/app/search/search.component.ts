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
        this.userService.getStudentHomeData().subscribe({
            next: (data) => {
                this.coursesList = data.courses || [];
                this.courseCodes = data.courseids || [];
                this.types = data.types || [];
                this.years = data.terms || [];
                this.academicYears = data.year || [];
                this.departments = data.program || [];
            },
            error: (err) => console.error('Error fetching dropdown data:', err)
        });

        // 2. Handle Query Params & Initial Search
        this.route.queryParams.subscribe(params => {
            console.log('SearchComponent: QueryParams changed', params);
            // Pre-fill inputs from query params
            this.selectedSession = params['session'] || '';
            this.selectedCode = params['code'] || '';
            this.selectedCourse = params['course'] || '';
            this.selectedYear = params['year'] || '';

            // Always search on load, even with no params (View All)
            this.showEmptyState = false;
            this.currentFilters = params;
            this.currentPage = 0;
            this.papers = []; // Clear previous results
            this.fetchPapers();
        });

        // 3. Fetch Favorites
        this.fetchFavorites();
    }

    // Triggered by the Search Button in the new UI
    onSearch() {
        // Update currentFilters from visible UI elements
        this.currentFilters = {
            session: this.selectedSession,
            code: this.selectedCode,
            year: this.selectedYear
        };

        // Update URL without reloading to keep state in sync
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: this.currentFilters,
            queryParamsHandling: 'merge', // merge with existing if any
        });

        // The queryParams subscription will trigger fetchPapers, so we might not need to call it manually here
        // But to be explicit and avoid race conditions if subscription doesn't fire on same params:
        // Actually, navigating updates params -> triggers subscription -> triggers fetch.
        // So just navigating is enough.
    }

    fetchPapers() {
        this.isLoading = true;
        this.userService.searchPapers(this.currentFilters, this.currentPage).subscribe({
            next: (data) => {
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
                        title: paper.course,
                        tag: paper.courseid,
                        year: paper.year,
                        term: paper.term,
                        sem: paper.sem,
                        code: paper.courseid,
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
            error: (err) => {
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
            next: (data) => {
                const favs = data.favorites || data.favourites || [];
                if (favs) {
                    this.favoriteIds = new Set(favs.map((f: any) => f._id?.$oid || f._id));
                }
            },
            error: (err) => console.error('Error fetching favorites:', err)
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
                error: (err) => {
                    console.error('Error removing favorite:', err);
                    this.favoriteIds.add(id); // Revert
                }
            });
        } else {
            // Optimistic Add
            this.favoriteIds.add(id);
            this.userService.addToFavorites(id).subscribe({
                next: () => console.log('Added to favorites:', id),
                error: (err) => {
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
            error: (err) => console.error('Error viewing paper:', err)
        });
    }
}
