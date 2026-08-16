package com.example.logis.controllers;

import com.example.logis.data.User;
import com.example.logis.dtos.CompanyResponse;
import com.example.logis.dtos.CreateCompanyRequest;
import com.example.logis.repository.UserRepository;
import com.example.logis.services.CompanyService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
public class CompanyController {
    private final CompanyService companyService;
    private final UserRepository userRepository;

    public CompanyController(CompanyService companyService, UserRepository userRepository){
        this.companyService = companyService;
        this.userRepository = userRepository;
    }

    @PostMapping("/companies")
    public CompanyResponse createCompany(@RequestBody @Valid CreateCompanyRequest request, Authentication authentication){
        User creator = (User) authentication.getPrincipal();
        return companyService.createCompany(request, creator);
    }

    @GetMapping("/companies/{id}")
    public CompanyResponse getCompany(@PathVariable long id){
        return companyService.getCompany(id);
    }

    @GetMapping("/companies/{id}/workerCount")
    public int getCompanyWorkerCount(@PathVariable long id){
        return userRepository.countByCompanyId(id);
    }
}
