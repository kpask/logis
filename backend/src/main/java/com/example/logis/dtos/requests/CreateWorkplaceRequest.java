package com.example.logis.dtos.requests;

import com.example.logis.data.entities.Location;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record CreateWorkplaceRequest(
        @NotBlank String name,
        @Valid Location location,
        @Positive Double radiusDistance
) {}
