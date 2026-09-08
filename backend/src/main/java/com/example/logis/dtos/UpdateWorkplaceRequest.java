package com.example.logis.dtos;

import com.example.logis.data.Location;
import jakarta.validation.constraints.NotBlank;

public record UpdateWorkplaceRequest(
        @NotBlank String name,
        Location location,
        Double radiusDistance
) {}