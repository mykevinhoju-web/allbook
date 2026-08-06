import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import type {
  RatingDistribution,
  SalonReview,
  SalonReviewsSummary,
} from "@/types/salon";

type AnySupabase = SupabaseClient<Database>;

type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  author_name: string | null;
  author_avatar: string | null;
  images: string[] | null;
  like_count: number | null;
  created_at: string;
};

function mapReview(row: ReviewRow): SalonReview {
  return {
    id: row.id,
    rating: Number(row.rating) || 0,
    comment: row.comment,
    authorName: row.author_name?.trim() || "Guest",
    authorAvatar: row.author_avatar,
    images: row.images ?? [],
    likeCount: row.like_count ?? 0,
    createdAt: row.created_at,
  };
}

export function buildRatingDistribution(
  reviews: SalonReview[],
): RatingDistribution[] {
  const counts: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  for (const review of reviews) {
    const stars = Math.min(5, Math.max(1, Math.round(review.rating))) as
      | 1
      | 2
      | 3
      | 4
      | 5;
    counts[stars] += 1;
  }

  const total = reviews.length || 1;

  return ([5, 4, 3, 2, 1] as const).map((stars) => ({
    stars,
    count: counts[stars],
    percent: Math.round((counts[stars] / total) * 100),
  }));
}

export async function getReviews(
  supabase: AnySupabase,
  salonId: string,
): Promise<{ summary: SalonReviewsSummary; error: string | null }> {
  const { data, error } = await supabase
    .from("reviews")
    .select(
      "id, rating, comment, author_name, author_avatar, images, like_count, created_at",
    )
    .eq("salon_id", salonId)
    .order("created_at", { ascending: false });

  if (error) {
    return {
      summary: {
        average: 0,
        total: 0,
        distribution: buildRatingDistribution([]),
        reviews: [],
      },
      error: error.message,
    };
  }

  const reviews = ((data ?? []) as ReviewRow[]).map(mapReview);
  const average =
    reviews.length === 0
      ? 0
      : reviews.reduce((sum, review) => sum + review.rating, 0) /
        reviews.length;

  return {
    summary: {
      average: Math.round(average * 10) / 10,
      total: reviews.length,
      distribution: buildRatingDistribution(reviews),
      reviews,
    },
    error: null,
  };
}
