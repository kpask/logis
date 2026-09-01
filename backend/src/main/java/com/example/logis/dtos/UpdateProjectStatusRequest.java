package com.example.logis.dtos;

import com.example.logis.data.ProjectStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateProjectStatusRequest(
        @NotNull(message = "Status is required")
        ProjectStatus status
) {}