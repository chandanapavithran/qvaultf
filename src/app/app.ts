import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { Toast } from './shared/components/toast/toast';
import { LoaderComponent } from './shared/loader/loader.component';
import { LoaderService } from './shared/loader/loader.service';

import { HeaderComponent } from './shared/components/header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Toast, CommonModule, HeaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  title = 'qvaultf';
  showFooter = true;

  constructor(private router: Router, private loaderService: LoaderService) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.loaderService.show();
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.loaderService.hide();
      }

      if (event instanceof NavigationEnd) {
        const hiddenRoutes = ['/login', '/signup', '/register', '/forgot-password', '/otp', '/reset-password'];
        this.showFooter = !hiddenRoutes.some(route => event.urlAfterRedirects.includes(route));
      }
    });
  }
}
