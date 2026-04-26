package com.university.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.university.dto.ResourceReviewListResponse;
import com.university.dto.ResourceReviewRequest;
import com.university.dto.ResourceReviewResponse;
import com.university.service.ResourceReviewService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/resources/{resourceId}/reviews")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:*"})
public class ResourceReviewController {

    private final ResourceReviewService reviewService;

    @GetMapping
    public ResponseEntity<ResourceReviewListResponse> getReviews(
            @PathVariable String resourceId,
            Authentication authentication) {
        ResourceReviewListResponse response = reviewService.getReviewsForResource(resourceId, authentication.getName());
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<ResourceReviewResponse> createReview(
            @PathVariable String resourceId,
            @Valid @RequestBody ResourceReviewRequest request,
            Authentication authentication) {
        ResourceReviewResponse response = reviewService.createReview(resourceId, authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/me")
    public ResponseEntity<ResourceReviewResponse> updateMyReview(
            @PathVariable String resourceId,
            @Valid @RequestBody ResourceReviewRequest request,
            Authentication authentication) {
        ResourceReviewResponse response = reviewService.updateMyReview(resourceId, authentication.getName(), request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteMyReview(
            @PathVariable String resourceId,
            Authentication authentication) {
        reviewService.deleteMyReview(resourceId, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
