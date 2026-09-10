package com.example.logis.dtos.responses;

import java.time.LocalTime;

public record CompanySettingsResponse(
        long defaultLunchLength,
        LocalTime defaultStartTime,
        LocalTime defaultEndTime
) {}
