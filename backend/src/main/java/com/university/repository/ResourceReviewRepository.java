package com.university.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import com.university.entity.ResourceReview;

public interface ResourceReviewRepository extends MongoRepository<ResourceReview, String> {

    @Query("{ '$or': [ { 'resourceId': ?0 }, { 'resource.$id': ?0 } ] }")
    List<ResourceReview> findByResourceId(String resourceId, Sort sort);

    @Query("{ '$or': [ { 'resourceId': ?0, 'userId': ?1 }, { 'resource.$id': ?0, 'user.$id': ?1 } ] }")
    Optional<ResourceReview> findByResourceIdAndUserId(String resourceId, String userId);

    @Query(value = "{ '$or': [ { 'resourceId': ?0 }, { 'resource.$id': ?0 } ] }", count = true)
    long countByResourceId(String resourceId);
}
