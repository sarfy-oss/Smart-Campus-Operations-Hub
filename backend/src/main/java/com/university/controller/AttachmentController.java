package com.university.controller;

import com.university.dto.TicketAttachmentResponse;
import com.university.service.AttachmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

/**
 * REST controller for ticket attachment management.
 * Base path: /api/v1/tickets/{ticketId}/attachments
 */
@RestController
@RequiredArgsConstructor
@Tag(name = "Attachments", description = "Ticket attachment upload and management endpoints")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:*"})
public class AttachmentController {

    private final AttachmentService attachmentService;

    /**
     * Upload image attachment(s) to a ticket.
     * POST /api/v1/tickets/{ticketId}/attachments
     * Max 3 images, image types only, 5MB max per file
     * Access: Ticket reporter or admin
     */
    @PostMapping("/api/v1/tickets/{ticketId}/attachments")
    @Operation(summary = "Upload image attachments to a ticket (max 3)")
    public ResponseEntity<List<TicketAttachmentResponse>> uploadAttachments(
            @PathVariable String ticketId,
            @RequestParam("files") List<MultipartFile> files
    ) throws IOException {
        List<TicketAttachmentResponse> responses = attachmentService.uploadAttachments(ticketId, files);
        return ResponseEntity.status(HttpStatus.CREATED).body(responses);
    }

    /**
     * Get all attachments for a ticket.
     * GET /api/v1/tickets/{ticketId}/attachments
     * Access: Ticket reporter, assigned technician, or admin
     */
    @GetMapping("/api/v1/tickets/{ticketId}/attachments")
    @Operation(summary = "Get all attachments for a ticket")
    public ResponseEntity<List<TicketAttachmentResponse>> getAttachments(
            @PathVariable String ticketId
    ) {
        List<TicketAttachmentResponse> responses = attachmentService.getAttachments(ticketId);
        return ResponseEntity.ok(responses);
    }

    /**
     * Delete a specific attachment.
     * DELETE /api/v1/tickets/{ticketId}/attachments/{attachmentId}
     * Access: Ticket reporter or admin
     */
    @DeleteMapping("/api/v1/tickets/{ticketId}/attachments/{attachmentId}")
    @Operation(summary = "Delete a specific attachment")
    public ResponseEntity<Void> deleteAttachment(
            @PathVariable String ticketId,
            @PathVariable String attachmentId
    ) {
        attachmentService.deleteAttachment(attachmentId);
        return ResponseEntity.noContent().build();
    }
}
