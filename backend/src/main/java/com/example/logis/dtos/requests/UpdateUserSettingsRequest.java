package com.example.logis.dtos.requests;

import com.example.logis.data.enums.Language;
import jakarta.validation.constraints.NotNull;

public record UpdateUserSettingsRequest(
        @NotNull(message = "Language is required")
        Language language
) {}
