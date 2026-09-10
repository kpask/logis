package com.example.logis.dtos.requests;

import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public record UpdateTimeEntryRequest(
        @NotNull Instant startTime,
        @NotNull Instant endTime
) {}