package com.university.service;

import com.university.dto.ResourceReviewRequestDTO;
import com.university.dto.ResourceReviewResponseDTO;
import com.university.dto.ResourceReviewSummaryDTO;
import com.university.entity.Resource;
import com.university.entity.ResourceReview;
import com.university.entity.User;
import com.university.exception.ResourceNotFoundException;
import com.university.exception.ResourceValidationException;
import com.university.repository.ResourceRepository;
import com.university.repository.ResourceReviewRepository;
import com.university.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ResourceReviewService {

    private final ResourceReviewRepository resourceReviewRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<ResourceReviewResponseDTO> getReviews(String resourceId) {
        ensureResourceExists(resourceId);
        return resourceReviewRepository.findByResourceIdOrderByCreatedAtDesc(resourceId)
                .stream()
                .map(this::mapToResponseDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public ResourceReviewSummaryDTO getSummary(String resourceId) {
        ensureResourceExists(resourceId);

        List<ResourceReview> reviews = resourceReviewRepository.findByResourceIdOrderByCreatedAtDesc(resourceId);
        if (reviews.isEmpty()) {
            return ResourceReviewSummaryDTO.builder()
                    .totalReviews(0)
                    .averageRating(0.0)
                    .build();
        }

        double averageRating = reviews.stream()
                .mapToInt(review -> review.getRating() == null ? 0 : review.getRating())
                .average()
                .orElse(0.0);

        return ResourceReviewSummaryDTO.builder()
                .totalReviews(reviews.size())
                .averageRating(Math.round(averageRating * 10.0) / 10.0)
                .build();
    }

    public ResourceReviewResponseDTO submitReview(String resourceId, String username, ResourceReviewRequestDTO dto) {
        ensureResourceExists(resourceId);

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceValidationException("Current user not found"));

        if (resourceReviewRepository.existsByResourceIdAndUserId(resourceId, user.getId())) {
            throw new ResourceValidationException("You have already reviewed this resource");
        }

        ResourceReview review = ResourceReview.builder()
                .resourceId(resourceId)
                .userId(user.getId())
                .username(user.getUsername())
                .rating(dto.getRating())
                .comment(dto.getComment().trim())
                .build();

        ResourceReview saved = resourceReviewRepository.save(review);
        log.info("Review created for resource {} by user {}", resourceId, username);
        return mapToResponseDTO(saved);
    }

    private void ensureResourceExists(String resourceId) {
        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException(resourceId));
        if (resource == null) {
            throw new ResourceNotFoundException(resourceId);
        }
    }

    private ResourceReviewResponseDTO mapToResponseDTO(ResourceReview review) {
        return ResourceReviewResponseDTO.builder()
                .id(review.getId())
                .resourceId(review.getResourceId())
                .userId(review.getUserId())
                .username(review.getUsername())
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }
}