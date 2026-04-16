package com.university.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class BookingStatusUpdateDTO {

    @NotBlank(message = "Status is required")
    @JsonProperty("status")
    private String status;  // String ලෙස receive කරලා service layer ගෙන් enum convert කරනවා

    @JsonProperty("adminNote")
    private String adminNote;
}
