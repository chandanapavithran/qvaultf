import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { UserService } from '../core/services/user.service';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface QuestionPaper {
    id: string;
    subjectCode: string;
    subjectName: string;
    examType: string;
    year: string;
}

@Component({
    selector: 'app-favorites',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './favorites.component.html',
    styleUrl: './favorites.component.scss'
})
export class FavoritesComponent implements OnInit {
    favorites$!: Observable<QuestionPaper[]>;
    removingIds = new Set<string>();
    user: any = {
        name: '',
        email: '',
        initials: ''
    };
    showProfileMenu = false;

    constructor(
        private userService: UserService,
        private router: Router
    ) {
        this.fetchFavorites();

        const details = this.userService.getUserDetails();
        this.user.name = details.name;
        this.user.email = details.email;
        this.user.initials = this.userService.getAvatarInitials();
    }

    ngOnInit(): void { }

    fetchFavorites() {
        this.favorites$ = this.userService.getFavorites().pipe(
            map((data: any) => {
                console.log('DEBUG: Favorites page raw data:', data);
                const favs = data.favorites || data.favourites || [];
                console.log('DEBUG: Favorites list to map:', favs);
                // Helper to safely extract ID
                const getId = (p: any) => p._id?.$oid || p._id || p.id;

                return favs.map((paper: any) => ({
                    id: getId(paper),
                    subjectCode: paper.courseid,
                    subjectName: paper.course,
                    examType: `${paper.term} • Semester ${paper.sem}`,
                    year: paper.year
                }));
            }),
            catchError(err => {
                console.error('Error fetching favorites', err);
                return of([]);
            })
        );
    }

    removeFromFavorites(paper: QuestionPaper) {
        this.removingIds.add(paper.id); // Show outline immediately
        this.userService.removeFromFavorites(paper.id).subscribe({
            next: () => {
                // Refresh list
                this.fetchFavorites();
                this.removingIds.delete(paper.id);
            },
            error: (err) => {
                console.error('Error removing favorite', err);
                this.removingIds.delete(paper.id); // Revert on error
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

    viewPaper(paper: any) {
        // ID is already extracted in map
        const id = paper.id;
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
