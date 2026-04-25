package com.university.controller;

import com.university.dto.CreateTicketRequest;
import com.university.dto.UpdateTicketStatusRequest;
import com.university.dto.AssignTechnicianRequest;
import com.university.dto.TicketResponse;
import com.university.entity.TicketStatus;
import com.university.entity.User;
import com.university.service.TicketService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for ticket management endpoints.
 * Base path: /api/v1/tickets
 */
@RestController
@RequestMapping("/api/v1/tickets")
@RequiredArgsConstructor
@Tag(name = "Tickets", description = "Incident ticket management endpoints")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:*"})
public class TicketController {

    private final TicketService ticketService;

    /**
     * Create a new incident ticket.
     * POST /api/v1/tickets
     * Access: Any authenticated user
     */
    @PostMapping
    @Operation(summary = "Create a new incident ticket")
    public ResponseEntity<TicketResponse> createTicket(
            @Valid @RequestBody CreateTicketRequest request,
            Authentication authentication
    ) {
        User reporter = (User) authentication.getPrincipal();
        TicketResponse response = ticketService.createTicket(request, reporter);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get all tickets (admin only).
     * GET /api/v1/tickets
     * Access: ADMIN
     */
    @GetMapping
    @Operation(summary = "Get all tickets")
    public ResponseEntity<List<TicketResponse>> getAllTickets() {
        List<TicketResponse> tickets = ticketService.getAllTickets();
        return ResponseEntity.ok(tickets);
    }

    /**
     * Get tickets by status filter.
     * GET /api/v1/tickets/by-status?status=OPEN
     * Access: ADMIN
     */
    @GetMapping("/by-status")
    @Operation(summary = "Get tickets filtered by status")
    public ResponseEntity<List<TicketResponse>> getTicketsByStatus(
            @RequestParam TicketStatus status
    ) {
        List<TicketResponse> tickets = ticketService.getTicketsByStatus(status);
        return ResponseEntity.ok(tickets);
    }

    /**
     * Get my reported tickets.
     * GET /api/v1/tickets/my
     * Access: Any authenticated user
     */
    @GetMapping("/my")
    @Operation(summary = "Get current user's reported tickets")
    public ResponseEntity<List<TicketResponse>> getMyTickets(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        List<TicketResponse> tickets = ticketService.getMyTickets(currentUser);
        return ResponseEntity.ok(tickets);
    }

    /**
     * Get tickets assigned to current technician.
     * GET /api/v1/tickets/assigned
     * Access: TECHNICIAN
     */
    @GetMapping("/assigned")
    @Operation(summary = "Get tickets assigned to current technician")
    public ResponseEntity<List<TicketResponse>> getAssignedTickets(Authentication authentication) {
        User technician = (User) authentication.getPrincipal();
        List<TicketResponse> tickets = ticketService.getAssignedTickets(technician);
        return ResponseEntity.ok(tickets);
    }

    /**
     * Get open tickets (OPEN or IN_PROGRESS).
     * GET /api/v1/tickets/open
     * Access: Any authenticated user
     */
    @GetMapping("/open")
    @Operation(summary = "Get all open tickets")
    public ResponseEntity<List<TicketResponse>> getOpenTickets() {
        List<TicketResponse> tickets = ticketService.getOpenTickets();
        return ResponseEntity.ok(tickets);
    }

    /**
     * Search tickets by title.
     * GET /api/v1/tickets/search?keyword=projector
     * Access: Any authenticated user
     */
    @GetMapping("/search")
    @Operation(summary = "Search tickets by title keyword")
    public ResponseEntity<List<TicketResponse>> searchByTitle(@RequestParam String keyword) {
        List<TicketResponse> tickets = ticketService.searchByTitle(keyword);
        return ResponseEntity.ok(tickets);
    }

    /**
     * Get a single ticket by ID.
     * GET /api/v1/tickets/{id}
     * Access: Ticket reporter, assigned technician, or admin
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get a ticket by ID")
    public ResponseEntity<TicketResponse> getTicketById(@PathVariable String id) {
        TicketResponse ticket = ticketService.getTicketById(id);
        return ResponseEntity.ok(ticket);
    }

    /**
     * Update ticket status.
     * PATCH /api/v1/tickets/{id}/status
     * Access: ADMIN or assigned TECHNICIAN
     */
    @PatchMapping("/{id}/status")
    @Operation(summary = "Update ticket status")
    public ResponseEntity<TicketResponse> updateTicketStatus(
            @PathVariable String id,
            @Valid @RequestBody UpdateTicketStatusRequest request,
            Authentication authentication
    ) {
        User currentUser = (User) authentication.getPrincipal();
        String userRole = extractRoleFromAuthentication(authentication);
        
        TicketResponse response = ticketService.updateTicketStatus(id, request, currentUser, userRole);
        return ResponseEntity.ok(response);
    }

    /**
     * Assign a technician to a ticket.
     * PATCH /api/v1/tickets/{id}/assign
     * Access: ADMIN only
     */
    @PatchMapping("/{id}/assign")
    @Operation(summary = "Assign a technician to a ticket")
    public ResponseEntity<TicketResponse> assignTechnician(
            @PathVariable String id,
            @Valid @RequestBody AssignTechnicianRequest request
    ) {
        TicketResponse response = ticketService.assignTechnician(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Delete a ticket.
     * DELETE /api/v1/tickets/{id}
     * Access: ADMIN only
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a ticket")
    public ResponseEntity<Void> deleteTicket(@PathVariable String id) {
        ticketService.deleteTicket(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Extract role from authentication token.
     */
    private String extractRoleFromAuthentication(Authentication authentication) {
        // Assuming role is stored in authorities; adjust if needed
        return authentication.getAuthorities().stream()
                .map(auth -> auth.getAuthority())
                .filter(auth -> auth.startsWith("ROLE_"))
                .map(auth -> auth.replace("ROLE_", ""))
                .findFirst()
                .orElse("USER");
    }
}
