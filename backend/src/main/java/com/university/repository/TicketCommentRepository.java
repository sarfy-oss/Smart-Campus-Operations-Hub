package com.university.repository;

import com.university.entity.Ticket;
import com.university.entity.TicketComment;
import com.university.entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for TicketComment entity.
 */
@Repository
public interface TicketCommentRepository extends MongoRepository<TicketComment, String> {

    // Find all comments for a ticket
    List<TicketComment> findByTicket(Ticket ticket);

    // Find all comments by an author
    List<TicketComment> findByAuthor(User author);

    // Delete all comments for a ticket
    void deleteByTicket(Ticket ticket);
}
