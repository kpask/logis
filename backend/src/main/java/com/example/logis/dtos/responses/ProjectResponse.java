package com.example.logis.dtos.responses;

import com.example.logis.data.enums.ProjectStatus;

import java.time.LocalDate;

public record ProjectResponse(
        Long id,
        String projectName,
        LocalDate startDate,
        LocalDate deadline,
        Long workplaceId,
        ProjectStatus projectStatus
) {}