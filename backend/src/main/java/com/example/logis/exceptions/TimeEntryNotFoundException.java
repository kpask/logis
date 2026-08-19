package com.example.logis.exceptions;

public class TimeEntryNotFoundException extends RuntimeException {
    public TimeEntryNotFoundException(Long id) {
        super("Time entry with id " + id + " not found");
    }
}