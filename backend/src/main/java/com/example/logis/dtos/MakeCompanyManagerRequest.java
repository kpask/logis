package com.example.logis.dtos;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record MakeCompanyManagerRequest(
        @NotNull
        @Positive
        Long requesterId,
        @NotNull
        @Positive
        Long companyId,
        @NotNull
        @Positive
        Long futureManagerId
) {}

