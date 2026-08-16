package com.example.logis.dtos;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record CreateCompanyRequest(
        @Size(min = 5, max = 100, message = "Company name must be between 5 and 100 characters")
        String name
) {}
