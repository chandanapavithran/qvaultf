import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { UserService } from '../../../core/services/user.service';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
    user: any = {};
    showProfileMenu = false;

    constructor(private userService: UserService, private router: Router) {
        const details = this.userService.getUserDetails();
        this.user = {
            name: details.name,
            email: details.email,
            initials: this.userService.getAvatarInitials()
        };
    }

    toggleProfileMenu() {
        this.showProfileMenu = !this.showProfileMenu;
    }

    logout() {
        this.userService.logout();
        this.router.navigate(['/login']);
    }
}
