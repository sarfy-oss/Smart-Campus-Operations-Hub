package com.university.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for ticket attachment response.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketAttachmentResponse {

    private String id;

    private String fileName;

    private String filePath;

    private String fileType;

    private long fileSize;

    private LocalDateTime uploadedAt;
}
