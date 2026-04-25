package com.university.service;

import com.university.dto.CreateTicketRequest;
import com.university.dto.UpdateTicketStatusRequest;
import com.university.dto.AssignTechnicianRequest;
import com.university.dto.TicketResponse;
import com.university.entity.Ticket;
import com.university.entity.TicketStatus;
import com.university.entity.TicketPriority;
import com.university.entity.TicketCategory;
import com.university.entity.User;
import com.university.exception.TicketNotFoundException;
import com.university.exception.UnauthorizedException;
import com.university.repository.TicketRepository;
import com.university.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for ticket management.
 * Handles CRUD, status transitions, and ticket-related business logic.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;

    /**
     * Create a new incident ticket.
     */
    public TicketResponse createTicket(CreateTicketRequest request, User reporter) {
        Ticket ticket = Ticket.builder()
                .title(request.getTitle())
                .category(request.getCategory())
                .description(request.getDescription())
                .priority(request.getPriority())
                .status(TicketStatus.OPEN)
                .resourceId(request.getResourceId())
                .locationText(request.getLocationText())
                .contactName(request.getContactName())
                .contactEmail(request.getContactEmail())
                .reportedBy(reporter)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        ticket = ticketRepository.save(ticket);
        log.info("Ticket created: {} by user {}", ticket.getId(), reporter.getUsername());
        return mapToResponse(ticket);
    }

    /**
     * Get all tickets (admin only).
     */
    public List<TicketResponse> getAllTickets() {
        return ticketRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get tickets by status.
     */
    public List<TicketResponse> getTicketsByStatus(TicketStatus status) {
        return ticketRepository.findByStatus(status)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get tickets reported by a user.
     */
    public List<TicketResponse> getMyTickets(User user) {
        return ticketRepository.findByReportedBy(user)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get tickets assigned to a technician.
     */
    public List<TicketResponse> getAssignedTickets(User technician) {
        return ticketRepository.findByAssignedTo(technician)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get a single ticket by ID.
     */
    public TicketResponse getTicketById(String id) {
        Ticket ticket = findTicketOrThrow(id);
        return mapToResponse(ticket);
    }

    /**
     * Update ticket status with validation of allowed transitions.
     * ADMIN can set any status. TECHNICIAN can only set IN_PROGRESS or RESOLVED.
     */
    public TicketResponse updateTicketStatus(String id, UpdateTicketStatusRequest request, User currentUser, String userRole) {
        Ticket ticket = findTicketOrThrow(id);

        // Validate status transition
        validateStatusTransition(ticket.getStatus(), request.getStatus(), userRole);

        // If rejecting, require rejection reason
        if (request.getStatus() == TicketStatus.REJECTED) {
            if (request.getRejectionReason() == null || request.getRejectionReason().isBlank()) {
                throw new IllegalArgumentException("Rejection reason is required when rejecting a ticket");
            }
            ticket.setRejectionReason(request.getRejectionReason());
        }

        ticket.setStatus(request.getStatus());
        ticket.setUpdatedAt(LocalDateTime.now());
        ticket = ticketRepository.save(ticket);

        log.info("Ticket {} status updated to {} by user {}", id, request.getStatus(), currentUser.getUsername());
        return mapToResponse(ticket);
    }

    /**
     * Assign a technician to a ticket (admin only).
     */
    public TicketResponse assignTechnician(String id, AssignTechnicianRequest request) {
        Ticket ticket = findTicketOrThrow(id);
        User technician = userRepository.findById(request.getTechnicianId())
                .orElseThrow(() -> new RuntimeException("Technician not found"));

        ticket.setAssignedTo(technician);
        ticket.setUpdatedAt(LocalDateTime.now());
        ticket = ticketRepository.save(ticket);

        log.info("Ticket {} assigned to technician {}", id, technician.getUsername());
        return mapToResponse(ticket);
    }

    /**
     * Mark ticket as resolved with notes (technician only).
     */
    public TicketResponse resolveTicket(String id, String resolutionNotes, User technician) {
        Ticket ticket = findTicketOrThrow(id);

        // Check if technician is assigned to this ticket
        if (ticket.getAssignedTo() == null || !ticket.getAssignedTo().getId().equals(technician.getId())) {
            throw new UnauthorizedException("You are not assigned to this ticket");
        }

        ticket.setStatus(TicketStatus.RESOLVED);
        ticket.setResolutionNotes(resolutionNotes);
        ticket.setUpdatedAt(LocalDateTime.now());
        ticket = ticketRepository.save(ticket);

        log.info("Ticket {} marked as RESOLVED by technician {}", id, technician.getUsername());
        return mapToResponse(ticket);
    }

    /**
     * Delete a ticket (admin only).
     */
    public void deleteTicket(String id) {
        Ticket ticket = findTicketOrThrow(id);
        ticketRepository.delete(ticket);
        log.info("Ticket {} deleted", id);
    }

    /**
     * Search tickets by title keyword.
     */
    public List<TicketResponse> searchByTitle(String keyword) {
        return ticketRepository.searchByTitle(keyword)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get open tickets (OPEN or IN_PROGRESS).
     */
    public List<TicketResponse> getOpenTickets() {
        return ticketRepository.findOpenTickets()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Validate status transition rules.
     */
    private void validateStatusTransition(TicketStatus current, TicketStatus next, String userRole) {
        // ADMIN can transition to any state
        if ("ADMIN".equals(userRole)) {
            return;
        }

        // TECHNICIAN restrictions
        if ("TECHNICIAN".equals(userRole)) {
            if (next != TicketStatus.IN_PROGRESS && next != TicketStatus.RESOLVED) {
                throw new IllegalArgumentException(
                    "Technicians can only transition to IN_PROGRESS or RESOLVED"
                );
            }
        }

        // Disallow backward transitions
        if (current == TicketStatus.CLOSED || current == TicketStatus.REJECTED) {
            throw new IllegalArgumentException(
                "Cannot transition from " + current + " status"
            );
        }
    }

    /**
     * Find ticket or throw exception.
     */
    public Ticket findTicketOrThrow(String id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new TicketNotFoundException("Ticket not found: " + id));
    }

    /**
     * Convert entity to response DTO.
     */
    private TicketResponse mapToResponse(Ticket ticket) {
        return TicketResponse.builder()
                .id(ticket.getId())
                .title(ticket.getTitle())
                .category(ticket.getCategory())
                .description(ticket.getDescription())
                .priority(ticket.getPriority())
                .status(ticket.getStatus())
                .resourceId(ticket.getResourceId())
                .locationText(ticket.getLocationText())
                .contactName(ticket.getContactName())
                .contactEmail(ticket.getContactEmail())
                .rejectionReason(ticket.getRejectionReason())
                .resolutionNotes(ticket.getResolutionNotes())
                .reportedById(ticket.getReportedBy().getId())
                .reportedByUsername(ticket.getReportedBy().getUsername())
                .assignedToId(ticket.getAssignedTo() != null ? ticket.getAssignedTo().getId() : null)
                .assignedToUsername(ticket.getAssignedTo() != null ? ticket.getAssignedTo().getUsername() : null)
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .build();
    }
}
