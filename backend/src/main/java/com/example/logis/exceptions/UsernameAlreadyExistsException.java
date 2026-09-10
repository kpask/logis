package com.example.logis.exceptions;

public class UsernameAlreadyExistsException extends RuntimeException {
    public UsernameAlreadyExistsException(String email) {
        super("User with username " + email + " already exists.");
    }
}
