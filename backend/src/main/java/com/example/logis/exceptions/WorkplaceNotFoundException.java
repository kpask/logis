package com.example.logis.exceptions;

public class WorkplaceNotFoundException extends RuntimeException {
    public WorkplaceNotFoundException(Long id) {
        super("Workplace with id " + id + " not found.");
    }
}
