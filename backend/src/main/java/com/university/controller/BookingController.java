package com.university.controller;

import com.university.dto.BookingRequestDTO;
import com.university.dto.BookingResponseDTO;
import com.university.dto.BookingStatusUpdateDTO;
import com.university.entity.enums.BookingStatus;
import com.university.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/bookings")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class BookingController {

    private final BookingService bookingService;

    /** POST /api/bookings - any authenticated user */
    @PostMapping
    public ResponseEntity<BookingResponseDTO> createBooking(
            @Valid @RequestBody BookingRequestDTO dto,
            Authentication auth) {
        // Admin can create booking on behalf of another user via targetUsername
        String username = auth.getName();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (isAdmin && dto.getTargetUsername() != null && !dto.getTargetUsername().isBlank()) {
            username = dto.getTargetUsername();
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(bookingService.createBooking(username, dto));
    }

    /** GET /api/bookings - admin only, all bookings */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<BookingResponseDTO>> getAllBookings(
            @RequestParam(name = "status", required = false) String status,
            @PageableDefault(size = 10, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        if (status != null && !status.isBlank()) {
            BookingStatus bs = BookingStatus.valueOf(status.toUpperCase());
            return ResponseEntity.ok(bookingService.getBookingsByStatus(bs, pageable));
        }
        return ResponseEntity.ok(bookingService.getAllBookings(pageable));
    }

    /** GET /api/bookings/my - current user's bookings */
    @GetMapping("/my")
    public ResponseEntity<Page<BookingResponseDTO>> getMyBookings(
            Authentication auth,
            @PageableDefault(size = 10, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(bookingService.getMyBookings(auth.getName(), pageable));
    }

    /** GET /api/bookings/{id} */
    @GetMapping("/{id}")
    public ResponseEntity<BookingResponseDTO> getBookingById(
            @PathVariable("id") String id) {
        return ResponseEntity.ok(bookingService.getBookingById(id));
    }

    /** PUT /api/bookings/{id}/status - admin approve/reject */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookingResponseDTO> updateStatus(
            @PathVariable("id") String id,
            @Valid @RequestBody BookingStatusUpdateDTO dto) {
        return ResponseEntity.ok(bookingService.updateBookingStatus(id, dto));
    }

    /** PUT /api/bookings/{id}/cancel - user cancels own booking */
    @PutMapping("/{id}/cancel")
    public ResponseEntity<BookingResponseDTO> cancelBooking(
            @PathVariable("id") String id,
            Authentication auth) {
        return ResponseEntity.ok(bookingService.cancelBooking(id, auth.getName()));
    }

    /** PUT /api/bookings/{id} - user edits own PENDING booking */
    @PutMapping("/{id}")
    public ResponseEntity<BookingResponseDTO> updateBooking(
            @PathVariable("id") String id,
            @Valid @RequestBody BookingRequestDTO dto,
            Authentication auth) {
        return ResponseEntity.ok(bookingService.updateBooking(id, dto, auth.getName()));
    }

    /** DELETE /api/bookings/{id} - admin deletes any booking */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteBooking(@PathVariable("id") String id) {
        bookingService.deleteBooking(id);
        return ResponseEntity.noContent().build();
    }
}
