package com.example.logis.dtos.requests;

import com.example.logis.data.enums.ProjectStatus;

import java.time.LocalDate;

public record UpdateProjectRequest(
    String projectName,
    LocalDate startDate,
    LocalDate deadline,
    ProjectStatus projectStatus
){}
