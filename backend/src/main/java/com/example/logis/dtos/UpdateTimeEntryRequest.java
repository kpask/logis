package com.example.logis.dtos;

import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public record UpdateTimeEntryRequest(
        @NotNull Instant startTime,
        @NotNull Instant endTime,
        Long lunchLength
) {}