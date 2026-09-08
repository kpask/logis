package com.example.logis.dtos.requests;

import com.example.logis.data.enums.ProjectStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateProjectStatusRequest(
        @NotNull(message = "Status is required")
        ProjectStatus status
) {}