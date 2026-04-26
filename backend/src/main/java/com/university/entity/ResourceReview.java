package com.university.entity;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ResourceReview document stores user rating/comment feedback for a resource.
 */
@Document(collection = "resource_reviews")
@CompoundIndex(name = "resource_user_unique_idx", def = "{'resourceId': 1, 'userId': 1}", unique = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResourceReview {

    @Id
    private String id;

    @DBRef
    private Resource resource;

    // Keep scalar IDs for stable querying/indexing alongside DBRef data.
    private String resourceId;

    @DBRef
    private User user;

    private String userId;

    private Integer rating;

    private String comment;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
