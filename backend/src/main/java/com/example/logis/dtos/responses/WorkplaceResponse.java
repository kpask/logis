package com.example.logis.dtos.responses;

import com.example.logis.data.entities.Location;

public record WorkplaceResponse(
        Long id,
        String name,
        Location location,
        Long companyId,
        double radiusDistance
) {}