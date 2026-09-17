package com.example.logis.dtos.requests;

import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
        @Size(min = 1, max = 25, message = "Name must be between 1 and 25 characters")
        String name,

        @Size(min = 1, max = 25, message = "Last name must be between 1 and 25 characters")
        String lastname,

        @Size(min = 3, max = 25, message = "Username must be between 3 and 25 characters")
        String username
) {}