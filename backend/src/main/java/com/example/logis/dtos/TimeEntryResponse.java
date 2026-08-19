package com.example.logis.dtos;

import java.time.Duration;
import java.time.Instant;

public record TimeEntryResponse(
        Long id,
        Long projectWorkerId,
        Long projectId,
        Instant startTime,
        Instant endTime,
        Duration duration
) {}