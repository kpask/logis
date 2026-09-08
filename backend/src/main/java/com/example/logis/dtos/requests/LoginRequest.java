package com.example.logis.dtos.requests;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;

public record LoginRequest(
        @Email(message = "Email should be valid")
        String email,
        @NotEmpty(message = "Password cannot be empty")
        String password
) {}
