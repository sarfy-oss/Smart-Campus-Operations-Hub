package com.university.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * TicketAttachment entity for storing evidence images linked to a ticket.
 * Max 3 attachments per ticket.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "ticket_attachments")
public class TicketAttachment {

    private String id;

    @DBRef
    private Ticket ticket;

    private String fileName;      // Original filename
    private String filePath;      // Server storage path or object key
    private String fileType;      // MIME type (e.g., image/jpeg)
    private long fileSize;        // File size in bytes

    private LocalDateTime uploadedAt;
}
