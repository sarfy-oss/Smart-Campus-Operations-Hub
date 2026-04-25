package com.university.controller;

import com.university.dto.CommentRequest;
import com.university.dto.CommentResponse;
import com.university.entity.User;
import com.university.service.CommentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for ticket comment management.
 * Base path: /api/v1/tickets/{ticketId}/comments
 */
@RestController
@RequiredArgsConstructor
@Tag(name = "Comments", description = "Ticket comment management endpoints")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:*"})
public class CommentController {

    private final CommentService commentService;

    /**
     * Add a comment to a ticket.
     * POST /api/v1/tickets/{ticketId}/comments
     * Access: Ticket reporter, assigned technician, or admin
     */
    @PostMapping("/api/v1/tickets/{ticketId}/comments")
    @Operation(summary = "Add a comment to a ticket")
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable String ticketId,
            @Valid @RequestBody CommentRequest request,
            Authentication authentication
    ) {
        User author = (User) authentication.getPrincipal();
        CommentResponse response = commentService.addComment(ticketId, request, author);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get all comments for a ticket.
     * GET /api/v1/tickets/{ticketId}/comments
     * Access: Ticket reporter, assigned technician, or admin
     */
    @GetMapping("/api/v1/tickets/{ticketId}/comments")
    @Operation(summary = "Get all comments for a ticket")
    public ResponseEntity<List<CommentResponse>> getComments(
            @PathVariable String ticketId,
            Authentication authentication
    ) {
        User currentUser = (User) authentication.getPrincipal();
        List<CommentResponse> responses = commentService.getComments(ticketId, currentUser.getId());
        return ResponseEntity.ok(responses);
    }

    /**
     * Edit a comment (author only).
     * PUT /api/v1/tickets/{ticketId}/comments/{commentId}
     * Access: Comment author or admin
     */
    @PutMapping("/api/v1/tickets/{ticketId}/comments/{commentId}")
    @Operation(summary = "Edit a comment (author only)")
    public ResponseEntity<CommentResponse> editComment(
            @PathVariable String ticketId,
            @PathVariable String commentId,
            @Valid @RequestBody CommentRequest request,
            Authentication authentication
    ) {
        User currentUser = (User) authentication.getPrincipal();
        CommentResponse response = commentService.editComment(commentId, request, currentUser);
        return ResponseEntity.ok(response);
    }

    /**
     * Delete a comment (author or admin).
     * DELETE /api/v1/tickets/{ticketId}/comments/{commentId}
     * Access: Comment author or admin
     */
    @DeleteMapping("/api/v1/tickets/{ticketId}/comments/{commentId}")
    @Operation(summary = "Delete a comment (author or admin)")
    public ResponseEntity<Void> deleteComment(
            @PathVariable String ticketId,
            @PathVariable String commentId,
            Authentication authentication
    ) {
        User currentUser = (User) authentication.getPrincipal();
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
