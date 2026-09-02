package com.example.logis.dtos;

import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public record CreateTimeEntryRequest(
        @NotNull
        Long workerId,
        @NotNull Instant startTime,
        Instant endTime,
        Long lunchLength
) {}