package com.university.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Ticket entity representing an incident/maintenance ticket.
 * Users create tickets, admins assign to technicians and manage workflow.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "tickets")
public class Ticket {

    private String id;

    private String title;

    private TicketCategory category;

    private String description;

    private TicketPriority priority;

    private TicketStatus status;

    // Link to a resource (optional; can use locationText as fallback)
    private String resourceId;

    // Free-text location if no resource linked
    private String locationText;

    // Reporter contact details
    private String contactName;
    private String contactEmail;

    // Reason for rejection (only populated if status == REJECTED)
    private String rejectionReason;

    // Resolution notes (populated when technician marks as RESOLVED)
    private String resolutionNotes;

    // User who reported/created the ticket
    @DBRef
    private User reportedBy;

    // Technician assigned to this ticket (optional)
    @DBRef
    private User assignedTo;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
