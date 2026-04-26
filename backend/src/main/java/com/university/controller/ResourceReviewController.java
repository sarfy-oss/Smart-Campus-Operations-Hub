package com.university.controller;

import com.university.dto.ResourceReviewRequestDTO;
import com.university.dto.ResourceReviewResponseDTO;
import com.university.dto.ResourceReviewSummaryDTO;
import com.university.service.ResourceReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/resources/{resourceId}/reviews")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(originPatterns = {
        "http://localhost:*",
        "http://127.0.0.1:*",
        "https://localhost:*",
        "https://127.0.0.1:*"
})
public class ResourceReviewController {

    private final ResourceReviewService resourceReviewService;

    @GetMapping
    public ResponseEntity<List<ResourceReviewResponseDTO>> getReviews(@PathVariable String resourceId) {
        log.info("GET request to fetch reviews for resource {}", resourceId);
        return ResponseEntity.ok(resourceReviewService.getReviews(resourceId));
    }

    @GetMapping("/summary")
    public ResponseEntity<ResourceReviewSummaryDTO> getSummary(@PathVariable String resourceId) {
        log.info("GET request to fetch review summary for resource {}", resourceId);
        return ResponseEntity.ok(resourceReviewService.getSummary(resourceId));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResourceReviewResponseDTO> submitReview(
            @PathVariable String resourceId,
            Authentication authentication,
            @Valid @RequestBody ResourceReviewRequestDTO requestDTO) {
        log.info("POST request to create review for resource {}", resourceId);

        ResourceReviewResponseDTO savedReview = resourceReviewService.submitReview(
                resourceId,
                authentication.getName(),
                requestDTO
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(savedReview);
    }
}