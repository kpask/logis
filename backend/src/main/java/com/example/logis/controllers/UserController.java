package com.example.logis.controllers;

import com.example.logis.data.entities.User;
import com.example.logis.dtos.requests.UpdateUserRequest;
import com.example.logis.dtos.requests.UpdateUserSettingsRequest;
import com.example.logis.dtos.responses.UserResponse;
import com.example.logis.dtos.responses.UserSettingsResponse;
import com.example.logis.services.UserSettingsService;

import jakarta.validation.Valid;

import com.example.logis.services.UserService;
import org.springframework.security.core.Authentication;
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
    public UserResponse getUser(@PathVariable Long id, Authentication authentication){
        Long requesterId = ((User) authentication.getPrincipal()).getId();
        return userService.getUserByIdAndUser(id, requesterId);
    }

    @PutMapping("/user/")
    public UserResponse updateUser(Authentication authentication, @RequestBody UpdateUserRequest request){
        Long requesterId = ((User) authentication.getPrincipal()).getId();
        return userService.updateUser(requesterId, request);
    }

    @GetMapping("/me/settings")
    public UserSettingsResponse getUserSettings(Authentication authentication){
        Long requesterId = ((User) authentication.getPrincipal()).getId();
        return userSettingsService.getSettingsByUser(requesterId);
    }

    @PutMapping("/me/settings")
    public UserSettingsResponse updateUserSettings(Authentication authentication, @RequestBody @Valid UpdateUserSettingsRequest request){
        Long requesterId = ((User) authentication.getPrincipal()).getId();
        return userSettingsService.updateSettingsByUser(requesterId, request);
    }
}
