package com.example.logis.dtos.requests;

import jakarta.validation.constraints.Min;

import java.time.LocalTime;

public record UpdateCompanySettingsRequest(
        @Min(value = 0, message = "Default lunch length cannot be negative")
        Long defaultLunchLength,
        LocalTime defaultStartTime,
        LocalTime defaultEndTime
) {}
