package com.example.logis.dtos;

import java.time.Instant;

public record TimeEntryResponse(
        Long id,
        Long projectWorkerId,
        Long workerId,
        Long projectId,
        Instant startTime,
        Instant endTime,
        long duration,
        long lunchLength
) {}