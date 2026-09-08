package com.example.logis.dtos.requests;

import com.example.logis.data.entities.Location;
import jakarta.validation.constraints.NotBlank;

public record UpdateWorkplaceRequest(
        @NotBlank String name,
        Location location,
        Double radiusDistance
) {}