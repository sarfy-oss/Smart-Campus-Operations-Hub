package com.university.dto;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ResourceReviewResponse {
    private String id;
    private Integer rating;
    private String comment;
    private String reviewerId;
    private String reviewerUsername;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
