package com.example.logis.exceptions;

public class UserNotFoundException extends RuntimeException {
    public UserNotFoundException(Long userId) {
        super("User with the id " + userId+ " not found.");
    }
}
