package com.example.logis.dtos.responses;

import java.time.Duration;
import java.time.LocalDate;

public record TimeWorkedResponse(
        Long userId,
        LocalDate date,
        Duration tracked,
        Duration worked
) {}