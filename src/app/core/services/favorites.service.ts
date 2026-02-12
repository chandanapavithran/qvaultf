import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface QuestionPaper {
    id: string;
    subjectCode: string;
    subjectName: string;
    examType: string; // e.g., "Final Exam • Semester 3", "Final Exam • Semester 2"
    year: number;
    isFavorite: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class FavoritesService {
    // Mock Data for "Populated" state demonstration
    private mockFavorites: QuestionPaper[] = [
        {
            id: '1',
            subjectCode: '22BCLA13J22',
            subjectName: 'Database Management Systems',
            examType: 'Final Exam • Semester 3',
            year: 2023,
            isFavorite: true
        },
        {
            id: '2',
            subjectCode: '22BCLA13J22',
            subjectName: 'Database Management Systems',
            examType: 'Final Exam • Semester 3',
            year: 2023,
            isFavorite: true
        },
        {
            id: '3',
            subjectCode: '22BCLA13J22',
            subjectName: 'Database Management Systems',
            examType: 'Final Exam • Semester 3',
            year: 2023,
            isFavorite: true
        },
        {
            id: '4',
            subjectCode: '22BCLA12J22',
            subjectName: 'Database Management Systems',
            examType: 'Final Exam • Semester 3',
            year: 2023,
            isFavorite: true
        }
    ];

    private favoritesSubject = new BehaviorSubject<QuestionPaper[]>([]); // Start empty
    public favorites$ = this.favoritesSubject.asObservable();

    constructor() {
        // Uncomment the line below to simulate POPULATED state
        this.favoritesSubject.next(this.mockFavorites);

        // Keep this line to simulate EMPTY state initially (or toggle as needed)
        // this.favoritesSubject.next([]); 
    }

    getFavorites(): Observable<QuestionPaper[]> {
        return this.favorites$;
    }

    // Toggle favorite status
    toggleFavorite(paperId: string): void {
        const currentFavorites = this.favoritesSubject.value;
        // In a real app, this would add/remove from the list.
        // For this mock, we'll just filter it out if it exists, or add it back from mock data

        if (currentFavorites.some(p => p.id === paperId)) {
            // Remove
            this.favoritesSubject.next(currentFavorites.filter(p => p.id !== paperId));
        } else {
            // Add back from mock (simplified logic)
            const paperToAdd = this.mockFavorites.find(p => p.id === paperId);
            if (paperToAdd) {
                this.favoritesSubject.next([...currentFavorites, paperToAdd]);
            }
        }
    }
}
