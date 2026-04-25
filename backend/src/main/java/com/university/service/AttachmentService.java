package com.university.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.university.dto.TicketAttachmentResponse;
import com.university.entity.Ticket;
import com.university.entity.TicketAttachment;
import com.university.exception.InvalidFileException;
import com.university.exception.MaxAttachmentsExceededException;
import com.university.repository.TicketAttachmentRepository;
import com.university.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for managing ticket attachments.
 * Handles file upload to Cloudinary, validation, and metadata storage.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AttachmentService {

    private final TicketAttachmentRepository attachmentRepository;
    private final TicketRepository ticketRepository;
    private final Cloudinary cloudinary;

    // Configuration
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    private static final int MAX_ATTACHMENTS = 3;
    private static final String[] ALLOWED_MIME_TYPES = {
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif"
    };

    /**
     * Upload attachment(s) to a ticket.
     * Max 3 images, image types only, max 5MB each.
     */
    public List<TicketAttachmentResponse> uploadAttachments(String ticketId, List<MultipartFile> files) throws IOException {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        // Check current attachment count
        long currentCount = attachmentRepository.countByTicket(ticket);
        if (currentCount + files.size() > MAX_ATTACHMENTS) {
            throw new MaxAttachmentsExceededException(
                "Maximum " + MAX_ATTACHMENTS + " attachments allowed. Current: " + currentCount
            );
        }

        List<TicketAttachment> uploaded = new java.util.ArrayList<>();

        for (MultipartFile file : files) {
            validateFile(file);
            TicketAttachment attachment = uploadToCloudinary(file, ticket);
            uploaded.add(attachment);
        }

        log.info("Uploaded {} attachments to ticket {}", uploaded.size(), ticketId);
        return uploaded.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get all attachments for a ticket.
     */
    public List<TicketAttachmentResponse> getAttachments(String ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        return attachmentRepository.findByTicket(ticket)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Delete a specific attachment.
     */
    public void deleteAttachment(String attachmentId) {
        TicketAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new RuntimeException("Attachment not found"));

        // Delete from Cloudinary if public_id exists
        try {
            if (attachment.getFilePath() != null && !attachment.getFilePath().isBlank()) {
                cloudinary.uploader().destroy(attachment.getFilePath(), ObjectUtils.emptyMap());
            }
        } catch (Exception e) {
            log.warn("Failed to delete from Cloudinary: {}", e.getMessage());
        }

        attachmentRepository.delete(attachment);
        log.info("Attachment deleted: {}", attachmentId);
    }

    /**
     * Validate file before upload.
     */
    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new InvalidFileException("File is empty");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new InvalidFileException("File exceeds max size of 5MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !isAllowedMimeType(contentType)) {
            throw new InvalidFileException(
                "Invalid file type. Allowed: JPEG, PNG, WebP, GIF. Received: " + contentType
            );
        }
    }

    /**
     * Check if MIME type is allowed.
     */
    private boolean isAllowedMimeType(String mimeType) {
        for (String allowed : ALLOWED_MIME_TYPES) {
            if (allowed.equals(mimeType)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Upload file to Cloudinary and save metadata.
     */
    private TicketAttachment uploadToCloudinary(MultipartFile file, Ticket ticket) throws IOException {
        // Upload to Cloudinary
        Map uploadResult = cloudinary.uploader().upload(
            file.getBytes(),
            ObjectUtils.asMap(
                "folder", "smartcampus/tickets/" + ticket.getId(),
                "resource_type", "auto",
                "quality", "auto"
            )
        );

        String publicId = (String) uploadResult.get("public_id");
        String secureUrl = (String) uploadResult.get("secure_url");

        // Save metadata to MongoDB
        TicketAttachment attachment = TicketAttachment.builder()
                .ticket(ticket)
                .fileName(file.getOriginalFilename())
                .filePath(publicId)  // Store Cloudinary public_id
                .fileType(file.getContentType())
                .fileSize(file.getSize())
                .uploadedAt(LocalDateTime.now())
                .build();

        attachment = attachmentRepository.save(attachment);
        log.info("File uploaded to Cloudinary: {} -> {}", file.getOriginalFilename(), publicId);
        return attachment;
    }

    /**
     * Convert entity to response DTO.
     */
    private TicketAttachmentResponse mapToResponse(TicketAttachment attachment) {
        return TicketAttachmentResponse.builder()
                .id(attachment.getId())
                .fileName(attachment.getFileName())
                .filePath(attachment.getFilePath())
                .fileType(attachment.getFileType())
                .fileSize(attachment.getFileSize())
                .uploadedAt(attachment.getUploadedAt())
                .build();
    }
}
