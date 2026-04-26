package com.university.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.university.dto.ResourceReviewListResponse;
import com.university.dto.ResourceReviewRequest;
import com.university.dto.ResourceReviewResponse;
import com.university.entity.Resource;
import com.university.entity.ResourceReview;
import com.university.entity.User;
import com.university.exception.ResourceNotFoundException;
import com.university.exception.ResourceValidationException;
import com.university.repository.ResourceRepository;
import com.university.repository.ResourceReviewRepository;
import com.university.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class ResourceReviewService {

    private final ResourceRepository resourceRepository;
    private final ResourceReviewRepository reviewRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public ResourceReviewListResponse getReviewsForResource(String resourceId, String username) {
        Resource resource = resourceRepository.findById(resourceId)
            .orElseThrow(() -> new ResourceNotFoundException(resourceId));

        User currentUser = getUserByUsername(username);

        List<ResourceReview> reviews = reviewRepository.findByResourceId(
            resource.getId(),
            Sort.by(Sort.Direction.DESC, "createdAt")
        );

        long totalReviews = reviews.size();
        double averageRating = reviews.stream()
            .mapToInt(ResourceReview::getRating)
            .average()
            .orElse(0.0);

        ResourceReviewResponse myReview = reviewRepository
            .findByResourceIdAndUserId(resource.getId(), currentUser.getId())
            .map(this::toResponse)
            .orElse(null);

        return ResourceReviewListResponse.builder()
            .resourceId(resource.getId())
            .averageRating(averageRating)
            .totalReviews(totalReviews)
            .canReview(myReview == null)
            .myReview(myReview)
            .reviews(reviews.stream().map(this::toResponse).toList())
            .build();
    }

    public ResourceReviewResponse createReview(String resourceId, String username, ResourceReviewRequest request) {
        Resource resource = resourceRepository.findById(resourceId)
            .orElseThrow(() -> new ResourceNotFoundException(resourceId));

        User currentUser = getUserByUsername(username);

        reviewRepository.findByResourceIdAndUserId(resource.getId(), currentUser.getId())
            .ifPresent(existing -> {
                throw new ResourceValidationException("You have already reviewed this resource.");
            });

        ResourceReview review = ResourceReview.builder()
            .resource(resource)
            .resourceId(resource.getId())
            .user(currentUser)
            .userId(currentUser.getId())
            .rating(request.getRating())
            .comment(request.getComment().trim())
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        return toResponse(reviewRepository.save(review));
    }

    public ResourceReviewResponse updateMyReview(String resourceId, String username, ResourceReviewRequest request) {
        User currentUser = getUserByUsername(username);

        ResourceReview review = reviewRepository.findByResourceIdAndUserId(resourceId, currentUser.getId())
            .orElseThrow(() -> new ResourceValidationException("No existing review found for this resource."));

        review.setRating(request.getRating());
        review.setComment(request.getComment().trim());
        review.setResourceId(resourceId);
        review.setUserId(currentUser.getId());
        review.setUpdatedAt(LocalDateTime.now());

        return toResponse(reviewRepository.save(review));
    }

    public void deleteMyReview(String resourceId, String username) {
        User currentUser = getUserByUsername(username);

        ResourceReview review = reviewRepository.findByResourceIdAndUserId(resourceId, currentUser.getId())
            .orElseThrow(() -> new ResourceValidationException("No existing review found for this resource."));

        reviewRepository.delete(review);
    }

    private User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
            .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found."));
    }

    private ResourceReviewResponse toResponse(ResourceReview review) {
        return ResourceReviewResponse.builder()
            .id(review.getId())
            .rating(review.getRating())
            .comment(review.getComment())
            .reviewerId(review.getUser() != null ? review.getUser().getId() : null)
            .reviewerUsername(review.getUser() != null ? review.getUser().getUsername() : "Unknown")
            .createdAt(review.getCreatedAt())
            .updatedAt(review.getUpdatedAt())
            .build();
    }
}
