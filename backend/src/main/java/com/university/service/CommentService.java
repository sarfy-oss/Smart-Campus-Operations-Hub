package com.university.service;

import com.university.dto.CommentRequest;
import com.university.dto.CommentResponse;
import com.university.entity.Ticket;
import com.university.entity.TicketComment;
import com.university.entity.User;
import com.university.exception.UnauthorizedException;
import com.university.repository.TicketCommentRepository;
import com.university.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for managing ticket comments.
 * Handles add, edit, delete with author ownership enforcement.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CommentService {

    private final TicketCommentRepository commentRepository;
    private final TicketRepository ticketRepository;

    /**
     * Add a comment to a ticket.
     */
    public CommentResponse addComment(String ticketId, CommentRequest request, User author) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        TicketComment comment = TicketComment.builder()
                .ticket(ticket)
                .author(author)
                .content(request.getContent())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        comment = commentRepository.save(comment);
        log.info("Comment added to ticket {} by user {}", ticketId, author.getUsername());
        return mapToResponse(comment, author.getId());
    }

    /**
     * Get all comments for a ticket.
     */
    public List<CommentResponse> getComments(String ticketId, String currentUserId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        return commentRepository.findByTicket(ticket)
                .stream()
                .map(comment -> mapToResponse(comment, currentUserId))
                .collect(Collectors.toList());
    }

    /**
     * Edit a comment (author only).
     */
    public CommentResponse editComment(String commentId, CommentRequest request, User currentUser) {
        TicketComment comment = findCommentOrThrow(commentId);

        // Check ownership
        if (!comment.getAuthor().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("You can only edit your own comments");
        }

        comment.setContent(request.getContent());
        comment.setUpdatedAt(LocalDateTime.now());
        comment = commentRepository.save(comment);

        log.info("Comment {} edited by user {}", commentId, currentUser.getUsername());
        return mapToResponse(comment, currentUser.getId());
    }

    /**
     * Delete a comment (author or admin).
     */
    public void deleteComment(String commentId, User currentUser, String userRole) {
        TicketComment comment = findCommentOrThrow(commentId);

        // Check ownership (author can delete own, admin can delete any)
        if (!comment.getAuthor().getId().equals(currentUser.getId()) && !"ADMIN".equals(userRole)) {
            throw new UnauthorizedException("You can only delete your own comments");
        }

        commentRepository.delete(comment);
        log.info("Comment {} deleted by user {}", commentId, currentUser.getUsername());
    }

    /**
     * Find comment or throw exception.
     */
    private TicketComment findCommentOrThrow(String id) {
        return commentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Comment not found: " + id));
    }

    /**
     * Convert entity to response DTO with ownership flag.
     */
    private CommentResponse mapToResponse(TicketComment comment, String currentUserId) {
        return CommentResponse.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .authorId(comment.getAuthor().getId())
                .authorUsername(comment.getAuthor().getUsername())
                .isAuthor(comment.getAuthor().getId().equals(currentUserId))
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }
}
