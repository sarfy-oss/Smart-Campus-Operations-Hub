package com.university.dto;

import com.university.entity.enums.BookingStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class BookingResponseDTO {
    private String id;
    private String resourceId;
    private String resourceName;
    private String username;
    private String bookingDate;
    private String startTime;
    private String endTime;
    private String purpose;
    private BookingStatus status;
    private String adminNote;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
