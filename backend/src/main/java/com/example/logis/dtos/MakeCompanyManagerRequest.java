package com.example.logis.dtos;

import jakarta.validation.constraints.Positive;

public record MakeCompanyManagerRequest(
        @Positive
        Long futureManagerId
) {}

