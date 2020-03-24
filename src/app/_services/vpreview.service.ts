import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '@environments/environment';

//import { vpReview } from '@app/_models';
import { pgFields } from '@app/_models';
import { pgApiResults  } from '@app/_models';

//return values are pgApiResults - the format of node-postgres query result from nodejs server
@Injectable({ providedIn: 'root' })
export class vpReviewService {
    constructor(private http: HttpClient) { }

    getAll(filter: string) {
        return this.http.get<pgApiResults>(`${environment.apiUrl}/review?${filter}`);
    }

    getById(id: number) {
        return this.http.get<pgApiResults>(`${environment.apiUrl}/review/${id}`);
    }

    getCount(filter: string) {
        return this.http.get<pgApiResults>(`${environment.apiUrl}/review/count?${filter}`);
    }

    createOrUpdate(update: boolean, reviewId: number, review: object) {
      if (update) {return this.update(reviewId, review);}
      else {return this.create(review);}
    }

    create(review: object) {
        return this.http.post<pgApiResults>(`${environment.apiUrl}/review`, review);
    }

    update(reviewId: number, review: object) {
        return this.http.put<pgApiResults>(`${environment.apiUrl}/review/${reviewId}`, review);
    }

    delete(reviewId: number) {
        return this.http.delete<pgApiResults>(`${environment.apiUrl}/review/${reviewId}`);
    }
}
