package com.university.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for ticket comment response.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentResponse {

    private String id;

    private String content;

    private String authorUsername;
    private String authorId;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Flag to indicate if current user is the author
    private boolean isAuthor;
}
