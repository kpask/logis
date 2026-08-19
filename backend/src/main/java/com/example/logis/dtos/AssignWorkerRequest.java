package com.example.logis.dtos;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record AssignWorkerRequest(
        @NotNull(message = "Worker id is required")
        @Positive(message = "Worker id must be positive")
        Long workerId
) {}