package com.university.repository;

import com.university.entity.ResourceReview;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ResourceReviewRepository extends MongoRepository<ResourceReview, String> {

    List<ResourceReview> findByResourceIdOrderByCreatedAtDesc(String resourceId);

    boolean existsByResourceIdAndUserId(String resourceId, String userId);

    long countByResourceId(String resourceId);
}