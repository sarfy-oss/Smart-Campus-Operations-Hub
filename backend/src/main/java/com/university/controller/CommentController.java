package com.university.controller;

import java.util.List;

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
import org.springframework.web.bind.annotation.RestController;

import com.university.dto.CommentRequest;
import com.university.dto.CommentResponse;
import com.university.entity.User;
import com.university.repository.UserRepository;
import com.university.service.CommentService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * REST controller for ticket comment management.
 * Base path: /v1/tickets/{ticketId}/comments (context path /api is added globally)
 */
@RestController
@RequiredArgsConstructor
@Tag(name = "Comments", description = "Ticket comment management endpoints")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:*"})
public class CommentController {

    private final CommentService commentService;
    private final UserRepository userRepository;

    /**
     * Add a comment to a ticket.
        * POST /v1/tickets/{ticketId}/comments
     * Access: Ticket reporter, assigned technician, or admin
     */
        @PostMapping("/v1/tickets/{ticketId}/comments")
    @Operation(summary = "Add a comment to a ticket")
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable String ticketId,
            @Valid @RequestBody CommentRequest request,
            Authentication authentication
    ) {
        User author = userRepository.findByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        CommentResponse response = commentService.addComment(ticketId, request, author);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get all comments for a ticket.
        * GET /v1/tickets/{ticketId}/comments
     * Access: Ticket reporter, assigned technician, or admin
     */
        @GetMapping("/v1/tickets/{ticketId}/comments")
    @Operation(summary = "Get all comments for a ticket")
    public ResponseEntity<List<CommentResponse>> getComments(
            @PathVariable String ticketId,
            Authentication authentication
    ) {
        User currentUser = userRepository.findByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        List<CommentResponse> responses = commentService.getComments(ticketId, currentUser.getId());
        return ResponseEntity.ok(responses);
    }

    /**
     * Edit a comment (author only).
        * PUT /v1/tickets/{ticketId}/comments/{commentId}
     * Access: Comment author or admin
     */
        @PutMapping("/v1/tickets/{ticketId}/comments/{commentId}")
    @Operation(summary = "Edit a comment (author only)")
    public ResponseEntity<CommentResponse> editComment(
            @PathVariable String ticketId,
            @PathVariable String commentId,
            @Valid @RequestBody CommentRequest request,
            Authentication authentication
    ) {
        User currentUser = userRepository.findByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        CommentResponse response = commentService.editComment(commentId, request, currentUser);
        return ResponseEntity.ok(response);
    }

    /**
     * Delete a comment (author or admin).
        * DELETE /v1/tickets/{ticketId}/comments/{commentId}
     * Access: Comment author or admin
     */
        @DeleteMapping("/v1/tickets/{ticketId}/comments/{commentId}")
    @Operation(summary = "Delete a comment (author or admin)")
    public ResponseEntity<Void> deleteComment(
            @PathVariable String ticketId,
            @PathVariable String commentId,
            Authentication authentication
    ) {
        User currentUser = userRepository.findByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        String userRole = extractRoleFromAuthentication(authentication);
        commentService.deleteComment(commentId, currentUser, userRole);
        return ResponseEntity.noContent().build();
    }

    /**
     * Extract role from authentication token.
     */
    private String extractRoleFromAuthentication(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .map(auth -> auth.getAuthority())
                .filter(auth -> auth.startsWith("ROLE_"))
                .map(auth -> auth.replace("ROLE_", ""))
                .findFirst()
                .orElse("USER");
    }
}
