package com.example.logis.dtos;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;

public record StartTimeEntryRequest(
        @DecimalMin("-90.0")
        @DecimalMax("90.0")
        Double latitude,

        @DecimalMin("-180.0")
        @DecimalMax("180.0")
        Double longitude
) {}