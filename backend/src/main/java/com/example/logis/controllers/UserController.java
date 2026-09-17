package com.example.logis.controllers;

import com.example.logis.data.entities.User;
import com.example.logis.dtos.requests.UpdateUserRequest;
import com.example.logis.dtos.requests.UpdateUserSettingsRequest;
import com.example.logis.dtos.responses.UserResponse;
import com.example.logis.dtos.responses.UserSettingsResponse;
import com.example.logis.services.UserSettingsService;

import jakarta.validation.Valid;

import com.example.logis.services.UserService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
public class UserController {
    private final UserService userService;
    private final UserSettingsService userSettingsService;
    public UserController(UserService userService, UserSettingsService userSettingsService){
        this.userService = userService;
        this.userSettingsService = userSettingsService;
    }

    @GetMapping("/user/{id}")
    public UserResponse getUser(@PathVariable Long id, @AuthenticationPrincipal User user){
        return userService.getUserByIdAndUser(id, user.getId());
    }

    @PutMapping("/user")
    public UserResponse updateUser(@AuthenticationPrincipal User user, @RequestBody UpdateUserRequest request){
        return userService.updateUser(user.getId(), request);
    }

    @GetMapping("/me/settings")
    public UserSettingsResponse getUserSettings(@AuthenticationPrincipal User user){
        return userSettingsService.getSettingsForUser(user.getId());
    }

    @PutMapping("/me/settings")
    public UserSettingsResponse updateUserSettings(@AuthenticationPrincipal User user, @RequestBody @Valid UpdateUserSettingsRequest request){
        return userSettingsService.updateSettingsForUser(user.getId(), request);
    }
}
