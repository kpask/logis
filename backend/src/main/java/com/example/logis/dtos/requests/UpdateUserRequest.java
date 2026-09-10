package com.example.logis.dtos.requests;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
        @NotBlank(message = "Name is required")
        @Size(max = 25, message = "Name must be at most 25 characters")
        String name,

        @NotBlank(message = "Last name is required")
        @Size(max = 25, message = "Last name must be at most 25 characters")
        String lastname,

        @NotBlank(message = "Username is required")
        @Size(min = 3, max = 25, message = "Username must be between 3 and 25 characters")
        String username
) {}