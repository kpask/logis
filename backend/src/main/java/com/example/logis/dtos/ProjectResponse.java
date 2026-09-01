package com.example.logis.dtos;

import com.example.logis.data.ProjectStatus;

import java.time.LocalDate;

public record ProjectResponse(
        Long id,
        String projectName,
        LocalDate startDate,
        LocalDate deadline,
        Long workplaceId,
        ProjectStatus projectStatus
) {}