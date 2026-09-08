package com.example.logis.dtos;

import com.example.logis.data.Location;

public record WorkplaceResponse(
        Long id,
        String name,
        Location location,
        Long companyId,
        double radiusDistance
) {}