package com.example.logis.dtos.requests;

import com.example.logis.data.enums.Language;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateInvitedUserRequest(

        @NotBlank(message = "Name is required")
        @Size(max = 25, message = "Name must be at most 25 characters")
        String name,

        @NotBlank(message = "Last name is required")
        @Size(max = 25, message = "Last name must be at most 25 characters")
        String lastname,

        @NotBlank(message = "Username is required")
        @Size(min = 3, max = 25, message = "Username must be between 3 and 25 characters")
        String username,

        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 72, message = "Password must be between 8 and 72 characters")
        String password,

        @NotBlank(message = "Invite token is required")
        @Size(min = 36, max = 36, message = "Invite token must be 36 characters long")
        String token,

        Language language
) {}
