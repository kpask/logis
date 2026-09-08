package com.example.logis.dtos.responses;

import com.example.logis.data.enums.CompanyRole;

public record UserResponse (
        Long id,
        String name,
        String lastname,
        String username,
        String email,
        CompanyRole companyRole,
        Long companyId
){}
