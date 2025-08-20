import { db } from '../db';
import { reviewArticlesTable } from '../db/schema';
import { eq, count, avg, sql } from 'drizzle-orm';

// Statistics interface for the review dashboard
export interface ReviewStats {
  total_reviews: number;
  published_reviews: number;
  draft_reviews: number;
  reviews_by_category: {
    mice: number;
    keyboards: number;
    headsets: number;
  };
  average_rating: number;
}

export async function getReviewStats(): Promise<ReviewStats> {
  try {
    // Get total count of reviews
    const totalCountResult = await db.select({
      count: count()
    })
    .from(reviewArticlesTable)
    .execute();

    const total_reviews = totalCountResult[0]?.count || 0;

    // Get published reviews count
    const publishedCountResult = await db.select({
      count: count()
    })
    .from(reviewArticlesTable)
    .where(eq(reviewArticlesTable.published, true))
    .execute();

    const published_reviews = publishedCountResult[0]?.count || 0;

    // Calculate draft reviews (total - published)
    const draft_reviews = total_reviews - published_reviews;

    // Get reviews count by category
    const categoryStatsResult = await db.select({
      category: reviewArticlesTable.category,
      count: count()
    })
    .from(reviewArticlesTable)
    .groupBy(reviewArticlesTable.category)
    .execute();

    // Initialize category counts
    const reviews_by_category = {
      mice: 0,
      keyboards: 0,
      headsets: 0
    };

    // Populate category counts from query results
    categoryStatsResult.forEach(stat => {
      if (stat.category in reviews_by_category) {
        reviews_by_category[stat.category as keyof typeof reviews_by_category] = stat.count;
      }
    });

    // Get average rating
    const avgRatingResult = await db.select({
      average: avg(reviewArticlesTable.star_rating)
    })
    .from(reviewArticlesTable)
    .execute();

    // Convert average rating to number, default to 0 if no reviews
    const average_rating = avgRatingResult[0]?.average 
      ? parseFloat(avgRatingResult[0].average) 
      : 0;

    return {
      total_reviews,
      published_reviews,
      draft_reviews,
      reviews_by_category,
      average_rating
    };
  } catch (error) {
    console.error('Failed to fetch review statistics:', error);
    throw error;
  }
}
