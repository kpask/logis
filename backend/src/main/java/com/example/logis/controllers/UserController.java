package com.example.logis.controllers;

import com.example.logis.data.User;
import com.example.logis.dtos.UserResponse;
import com.example.logis.services.UserService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
public class UserController {
    private final UserService userService;
    public UserController(UserService userService){
        this.userService = userService;
    }

    @GetMapping("/user/{id}")
    public UserResponse getUser(@PathVariable Long id, Authentication authentication){
        Long requesterId = ((User) authentication.getPrincipal()).getId();
        return userService.getUserByIdAndUser(id, requesterId);
    }
}
