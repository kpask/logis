package com.example.logis.dtos;

import com.example.logis.data.CompanyRole;

public record UserResponse (
        Long id,
        String name,
        String lastname,
        String username,
        String email,
        CompanyRole companyRole,
        Long companyId
){}
