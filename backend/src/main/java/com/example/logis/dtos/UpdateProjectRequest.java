package com.example.logis.dtos;

import com.example.logis.data.enums.ProjectStatus;

import java.time.LocalDate;

public record UpdateProjectRequest(
    String projectName,
    LocalDate startDate,
    LocalDate deadline,
    ProjectStatus projectStatus
){}
