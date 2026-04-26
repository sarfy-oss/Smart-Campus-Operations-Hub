package com.university.dto;

import java.util.List;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ResourceReviewListResponse {
    private String resourceId;
    private double averageRating;
    private long totalReviews;
    private boolean canReview;
    private ResourceReviewResponse myReview;
    private List<ResourceReviewResponse> reviews;
}
