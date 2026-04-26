package com.university.repository;

import com.university.entity.Ticket;
import com.university.entity.TicketStatus;
import com.university.entity.TicketPriority;
import com.university.entity.TicketCategory;
import com.university.entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Ticket entity with custom query methods.
 */
@Repository
public interface TicketRepository extends MongoRepository<Ticket, String> {

    // Find tickets by status
    List<Ticket> findByStatus(TicketStatus status);

    // Find tickets by priority
    List<Ticket> findByPriority(TicketPriority priority);

    // Find tickets by category
    List<Ticket> findByCategory(TicketCategory category);

    // Find tickets reported by a user
    List<Ticket> findByReportedBy(User user);

    // Find tickets assigned to a technician
    List<Ticket> findByAssignedTo(User technician);

    // Find tickets by status and priority
    List<Ticket> findByStatusAndPriority(TicketStatus status, TicketPriority priority);

    // Find tickets by multiple statuses
    List<Ticket> findByStatusIn(List<TicketStatus> statuses);

    // Find open tickets (OPEN or IN_PROGRESS)
    @Query("{ 'status': { $in: ['OPEN', 'IN_PROGRESS'] } }")
    List<Ticket> findOpenTickets();

    // Find tickets by resource ID
    List<Ticket> findByResourceId(String resourceId);

    // Find tickets by title search (case-insensitive)
    @Query("{ 'title': { $regex: ?0, $options: 'i' } }")
    List<Ticket> searchByTitle(String keyword);
}
