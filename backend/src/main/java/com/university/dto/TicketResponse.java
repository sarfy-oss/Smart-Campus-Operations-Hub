package com.university.dto;

import com.university.entity.TicketStatus;
import com.university.entity.TicketPriority;
import com.university.entity.TicketCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for ticket response, returned by the API.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketResponse {

    private String id;

    private String title;

    private TicketCategory category;

    private String description;

    private TicketPriority priority;

    private TicketStatus status;

    private String resourceId;

    private String locationText;

    private String contactName;
    private String contactEmail;

    private String rejectionReason;

    private String resolutionNotes;

    // Reporter info
    private String reportedByUsername;
    private String reportedById;

    // Assigned technician info
    private String assignedToUsername;
    private String assignedToId;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
