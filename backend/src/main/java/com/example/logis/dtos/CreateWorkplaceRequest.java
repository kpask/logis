package com.example.logis.dtos;

import com.example.logis.data.Location;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

import java.util.List;

public record CreateWorkplaceRequest(
        @NotBlank String name,
        @Valid Location location,
        @Positive Double radiusDistance
) {}
