package com.example.logis.controllers;

import com.example.logis.dtos.CreateInvitedUserRequest;
import com.example.logis.dtos.CreateUserRequest;
import com.example.logis.dtos.LoginRequest;
import com.example.logis.dtos.LoginResponse;
import com.example.logis.services.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/register")
    public LoginResponse register(@Valid @RequestBody CreateUserRequest request) {
        return authService.register(request);
    }

    @PostMapping("register/invitation/")
    public LoginResponse registerWithInvitation(@Valid @RequestBody CreateInvitedUserRequest request){
        return authService.register(request);
    }
}
