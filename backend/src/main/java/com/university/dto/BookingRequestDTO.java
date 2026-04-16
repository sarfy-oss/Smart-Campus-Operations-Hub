package com.university.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BookingRequestDTO {

    @NotBlank(message = "Resource ID is required")
    private String resourceId;

    @NotBlank(message = "Booking date is required")
    private String bookingDate; // yyyy-MM-dd

    @NotBlank(message = "Start time is required")
    private String startTime;   // HH:mm

    @NotBlank(message = "End time is required")
    private String endTime;     // HH:mm

    private String purpose;
}
