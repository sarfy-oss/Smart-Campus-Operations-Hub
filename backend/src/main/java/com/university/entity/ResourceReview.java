package com.university.entity;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "resource_reviews")
@CompoundIndexes({
        @CompoundIndex(name = "resource_user_unique_idx", def = "{'resourceId': 1, 'userId': 1}", unique = true)
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResourceReview {

    @Id
    private String id;

    @NotBlank
    private String resourceId;

    @NotBlank
    private String userId;

    @NotBlank
    private String username;

    @Min(1)
    @Max(5)
    private Integer rating;

    @NotBlank
    private String comment;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}