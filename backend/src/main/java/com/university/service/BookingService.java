package com.university.service;

import com.university.dto.BookingRequestDTO;
import com.university.dto.BookingResponseDTO;
import com.university.dto.BookingStatusUpdateDTO;
import com.university.entity.Booking;
import com.university.entity.NotificationType;
import com.university.entity.Resource;
import com.university.entity.enums.BookingStatus;
import com.university.entity.enums.ResourceStatus;
import com.university.exception.ResourceNotFoundException;
import com.university.exception.ResourceValidationException;
import com.university.repository.BookingRepository;
import com.university.repository.ResourceRepository;
import com.university.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    /** User creates a booking request */
    public BookingResponseDTO createBooking(String username, BookingRequestDTO dto) {
        Resource resource = resourceRepository.findById(dto.getResourceId())
                .orElseThrow(() -> new ResourceNotFoundException(dto.getResourceId()));

        if (resource.getStatus() != ResourceStatus.AVAILABLE) {
            throw new ResourceValidationException("Resource is not available for booking");
        }

        LocalDate date = LocalDate.parse(dto.getBookingDate(), DATE_FMT);
        LocalTime start = LocalTime.parse(dto.getStartTime(), TIME_FMT);
        LocalTime end = LocalTime.parse(dto.getEndTime(), TIME_FMT);

        if (!start.isBefore(end)) {
            throw new ResourceValidationException("Start time must be before end time");
        }

        // Conflict check
        List<Booking> existing = bookingRepository.findByResourceIdAndBookingDate(dto.getResourceId(), date);
        boolean conflict = existing.stream()
                .filter(b -> b.getStatus() == BookingStatus.PENDING || b.getStatus() == BookingStatus.APPROVED)
                .anyMatch(b -> start.isBefore(b.getEndTime()) && end.isAfter(b.getStartTime()));

        if (conflict) {
            throw new ResourceValidationException("This time slot is already booked for the selected resource");
        }

        Booking booking = Booking.builder()
                .resourceId(resource.getId())
                .resourceName(resource.getName())
                .username(username)
                .bookingDate(date)
                .startTime(start)
                .endTime(end)
                .purpose(dto.getPurpose())
                .status(BookingStatus.PENDING)
                .build();

        Booking saved = bookingRepository.save(booking);

        // Notify the user - booking received
        sendNotification(username,
                "📋 Booking request submitted for \"" + resource.getName() + "\" on " + dto.getBookingDate()
                + " (" + dto.getStartTime() + "–" + dto.getEndTime() + "). Awaiting admin approval.",
                NotificationType.SYSTEM);

        return toDTO(saved);
    }

    /** Get all bookings - admin */
    public Page<BookingResponseDTO> getAllBookings(Pageable pageable) {
        return bookingRepository.findAll(pageable).map(this::toDTO);
    }

    /** Get bookings by status - admin */
    public Page<BookingResponseDTO> getBookingsByStatus(BookingStatus status, Pageable pageable) {
        return bookingRepository.findByStatus(status, pageable).map(this::toDTO);
    }

    /** Get my bookings - user */
    public Page<BookingResponseDTO> getMyBookings(String username, Pageable pageable) {
        return bookingRepository.findByUsername(username, pageable).map(this::toDTO);
    }

    /** Get single booking */
    public BookingResponseDTO getBookingById(String id) {
        return toDTO(findBooking(id));
    }

    /** Admin approves or rejects */
    public BookingResponseDTO updateBookingStatus(String id, BookingStatusUpdateDTO dto) {
        Booking booking = findBooking(id);

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new ResourceValidationException("Cannot update a cancelled booking");
        }

        BookingStatus newStatus;
        try {
            newStatus = BookingStatus.valueOf(dto.getStatus().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResourceValidationException("Invalid status: " + dto.getStatus() + ". Use APPROVED or REJECTED");
        }

        booking.setStatus(newStatus);
        booking.setAdminNote(dto.getAdminNote());
        booking.setUpdatedAt(java.time.LocalDateTime.now());

        Booking updated = bookingRepository.save(booking);

        // Notify the user about the decision
        if (newStatus == BookingStatus.APPROVED) {
            sendNotification(booking.getUsername(),
                    "✅ Your booking for \"" + booking.getResourceName() + "\" on " + booking.getBookingDate()
                    + " (" + booking.getStartTime().format(TIME_FMT) + "–" + booking.getEndTime().format(TIME_FMT) + ") has been APPROVED."
                    + (dto.getAdminNote() != null && !dto.getAdminNote().isBlank() ? " Note: " + dto.getAdminNote() : ""),
                    NotificationType.BOOKING_APPROVED);
        } else if (newStatus == BookingStatus.REJECTED) {
            sendNotification(booking.getUsername(),
                    "❌ Your booking for \"" + booking.getResourceName() + "\" on " + booking.getBookingDate()
                    + " (" + booking.getStartTime().format(TIME_FMT) + "–" + booking.getEndTime().format(TIME_FMT) + ") has been REJECTED."
                    + (dto.getAdminNote() != null && !dto.getAdminNote().isBlank() ? " Reason: " + dto.getAdminNote() : ""),
                    NotificationType.BOOKING_REJECTED);
        }

        return toDTO(updated);
    }

    /** User cancels their own booking */
    public BookingResponseDTO cancelBooking(String id, String username) {
        Booking booking = findBooking(id);

        if (!booking.getUsername().equals(username)) {
            throw new ResourceValidationException("You can only cancel your own bookings");
        }
        if (booking.getStatus() == BookingStatus.APPROVED) {
            throw new ResourceValidationException("Cannot cancel an already approved booking. Contact admin.");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setUpdatedAt(java.time.LocalDateTime.now());

        Booking cancelled = bookingRepository.save(booking);

        // Notify the user
        sendNotification(username,
                "🚫 Your booking for \"" + booking.getResourceName() + "\" on " + booking.getBookingDate()
                + " has been cancelled.",
                NotificationType.SYSTEM);

        return toDTO(cancelled);
    }

    /** User edits own PENDING booking */
    public BookingResponseDTO updateBooking(String id, BookingRequestDTO dto, String username) {
        Booking booking = findBooking(id);

        if (!booking.getUsername().equals(username)) {
            throw new ResourceValidationException("You can only edit your own bookings");
        }
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new ResourceValidationException("Only PENDING bookings can be edited");
        }

        LocalDate date = LocalDate.parse(dto.getBookingDate(), DATE_FMT);
        LocalTime start = LocalTime.parse(dto.getStartTime(), TIME_FMT);
        LocalTime end = LocalTime.parse(dto.getEndTime(), TIME_FMT);

        if (!start.isBefore(end)) {
            throw new ResourceValidationException("Start time must be before end time");
        }

        // Conflict check (exclude current booking)
        List<Booking> existing = bookingRepository.findByResourceIdAndBookingDate(dto.getResourceId(), date);
        boolean conflict = existing.stream()
                .filter(b -> !b.getId().equals(id))
                .filter(b -> b.getStatus() == BookingStatus.PENDING || b.getStatus() == BookingStatus.APPROVED)
                .anyMatch(b -> start.isBefore(b.getEndTime()) && end.isAfter(b.getStartTime()));

        if (conflict) {
            throw new ResourceValidationException("This time slot is already booked for the selected resource");
        }

        Resource resource = resourceRepository.findById(dto.getResourceId())
                .orElseThrow(() -> new ResourceNotFoundException(dto.getResourceId()));

        booking.setResourceId(resource.getId());
        booking.setResourceName(resource.getName());
        booking.setBookingDate(date);
        booking.setStartTime(start);
        booking.setEndTime(end);
        booking.setPurpose(dto.getPurpose());
        booking.setUpdatedAt(java.time.LocalDateTime.now());

        return toDTO(bookingRepository.save(booking));
    }

    /** Admin deletes a booking */
    public void deleteBooking(String id) {
        if (!bookingRepository.existsById(id)) {
            throw new ResourceNotFoundException("Booking not found with id: " + id);
        }
        bookingRepository.deleteById(id);
    }

    private Booking findBooking(String id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));
    }

    /** Send notification to user by username (looks up userId) */
    private void sendNotification(String username, String message, NotificationType type) {
        try {
            userRepository.findByUsername(username).ifPresent(user ->
                notificationService.createNotification(user.getId(), message, type)
            );
        } catch (Exception e) {
            log.warn("Failed to send notification to user {}: {}", username, e.getMessage());
        }
    }

    private BookingResponseDTO toDTO(Booking b) {
        return BookingResponseDTO.builder()
                .id(b.getId())
                .resourceId(b.getResourceId())
                .resourceName(b.getResourceName())
                .username(b.getUsername())
                .bookingDate(b.getBookingDate() != null ? b.getBookingDate().format(DATE_FMT) : null)
                .startTime(b.getStartTime() != null ? b.getStartTime().format(TIME_FMT) : null)
                .endTime(b.getEndTime() != null ? b.getEndTime().format(TIME_FMT) : null)
                .purpose(b.getPurpose())
                .status(b.getStatus())
                .adminNote(b.getAdminNote())
                .createdAt(b.getCreatedAt())
                .updatedAt(b.getUpdatedAt())
                .build();
    }
}
