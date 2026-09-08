package com.example.logis.dtos.requests;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record AddUserToCompanyRequest(
        @NotNull
        @Positive
        Long userId,
        boolean manager
) {}
