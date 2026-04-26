package com.university.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * TicketComment entity for tracking comments on tickets.
 * Users, admins, and assigned technicians can add comments.
 * Only the author or admin can delete/edit.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "ticket_comments")
public class TicketComment {

    private String id;

    @DBRef
    private Ticket ticket;

    @DBRef
    private User author;

    private String content;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
