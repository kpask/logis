package com.example.logis.exceptions;

public class ResourceNotOwnedException extends RuntimeException {
    public ResourceNotOwnedException(String message) {
        super(message);
    }
}
