package com.example.logis.dtos.responses;

import com.example.logis.data.enums.InvitationStatus;

import java.time.LocalDateTime;

public record InvitationResponse(
        String companyName,
        String email,
        InvitationStatus status,
        LocalDateTime expiresAt,
        boolean userExists,
        String token
) {}
