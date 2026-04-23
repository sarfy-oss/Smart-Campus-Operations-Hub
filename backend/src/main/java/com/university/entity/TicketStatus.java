package com.university.entity;

/**
 * Ticket status enum representing the lifecycle of an incident ticket.
 * OPEN → IN_PROGRESS → RESOLVED → CLOSED
 * or OPEN → REJECTED (admin-only)
 */
public enum TicketStatus {
    OPEN,           // Newly created, awaiting assignment
    IN_PROGRESS,    // Work has begun
    RESOLVED,       // Work completed, awaiting admin closure
    CLOSED,         // Formally closed by admin
    REJECTED        // Rejected by admin with reason
}
