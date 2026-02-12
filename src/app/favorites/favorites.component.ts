import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FavoritesService, QuestionPaper } from '../core/services/favorites.service';
import { UserService } from '../core/services/user.service';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-favorites',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './favorites.component.html',
    styleUrl: './favorites.component.scss'
})
export class FavoritesComponent implements OnInit {
    favorites$: Observable<QuestionPaper[]>;
    user: any = {
        name: '',
        email: '',
        initials: ''
    };
    showProfileMenu = false;

    constructor(
        private favoritesService: FavoritesService,
        private userService: UserService,
        private router: Router
    ) {
        this.favorites$ = this.favoritesService.getFavorites();

        const details = this.userService.getUserDetails();
        this.user.name = details.name;
        this.user.email = details.email;
        this.user.initials = this.userService.getAvatarInitials();
    }

    ngOnInit(): void { }

    toggleProfileMenu() {
        this.showProfileMenu = !this.showProfileMenu;
    }

    logout() {
        this.userService.logout();
        this.router.navigate(['/login']);
    }
}
