package com.example.logis.dtos.responses;

import com.example.logis.data.enums.Language;

public record UserSettingsResponse(
        Language language
) {}