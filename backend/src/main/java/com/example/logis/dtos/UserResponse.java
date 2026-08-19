package com.example.logis.dtos;

import com.example.logis.data.GlobalRole;

public record UserResponse (
        Long id,
        String name,
        String lastname,
        String username,
        String email,
        GlobalRole globalRole,
        Long companyId
){}
