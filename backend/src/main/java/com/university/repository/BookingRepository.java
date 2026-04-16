package com.university.repository;

import com.university.entity.Booking;
import com.university.entity.enums.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface BookingRepository extends MongoRepository<Booking, String> {

    Page<Booking> findByUsername(String username, Pageable pageable);

    Page<Booking> findByStatus(BookingStatus status, Pageable pageable);

    Page<Booking> findByResourceId(String resourceId, Pageable pageable);

    // Check for time conflicts on same resource and date
    @Query("{ 'resourceId': ?0, 'bookingDate': ?1, 'status': { $in: ['PENDING', 'APPROVED'] }, $or: [ { 'startTime': { $lt: ?3 }, 'endTime': { $gt: ?2 } } ] }")
    List<Booking> findConflictingBookings(String resourceId, LocalDate date, String startTime, String endTime);

    List<Booking> findByResourceIdAndBookingDate(String resourceId, LocalDate date);
}
