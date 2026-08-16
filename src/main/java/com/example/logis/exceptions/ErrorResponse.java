package com.example.logis.exceptions;

public record ErrorResponse(
        String error,
        String message
) {}
