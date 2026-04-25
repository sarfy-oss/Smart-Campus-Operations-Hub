package com.university.repository;

import com.university.entity.Ticket;
import com.university.entity.TicketAttachment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for TicketAttachment entity.
 */
@Repository
public interface TicketAttachmentRepository extends MongoRepository<TicketAttachment, String> {

    // Find all attachments for a ticket
    List<TicketAttachment> findByTicket(Ticket ticket);

    // Count attachments for a ticket
    long countByTicket(Ticket ticket);

    // Delete all attachments for a ticket
    void deleteByTicket(Ticket ticket);
}
