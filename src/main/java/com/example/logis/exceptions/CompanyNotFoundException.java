package com.example.logis.exceptions;

public class CompanyNotFoundException extends RuntimeException {
    public CompanyNotFoundException(Long companyId) {
        super("Company with the id: " + companyId + " not found.");
    }
}
