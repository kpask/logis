package com.example.logis.dtos.responses;

import java.time.Duration;
import java.time.LocalDate;
import java.util.List;

public record TimeWorkedResponse(
        Long userId,
        LocalDate date,
        Duration tracked,
        Duration worked,
        List<String> projects
) {}