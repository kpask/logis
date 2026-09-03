package com.example.logis.controllers;

import com.example.logis.data.User;
import com.example.logis.dtos.CompanyResponse;
import com.example.logis.dtos.CreateCompanyRequest;
import com.example.logis.dtos.UserResponse;
import com.example.logis.services.CompanyService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class CompanyController {
    private final CompanyService companyService;

    public CompanyController(CompanyService companyService){
        this.companyService = companyService;
    }

    @PostMapping("/company")
    public CompanyResponse createCompany(@RequestBody @Valid CreateCompanyRequest request, Authentication authentication){
        Long creatorId = ((User) authentication.getPrincipal()).getId();
        return companyService.createCompany(request, creatorId);
    }

    @PostMapping("/company/manager/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void promote(@PathVariable @Positive long id, Authentication authentication){
        Long promoterId = ((User) authentication.getPrincipal()).getId();
        companyService.makeCompanyManager(id, promoterId);
    }

    @GetMapping("/company/")
    public CompanyResponse getCompany(Authentication authentication){
        Long userId = ((User) authentication.getPrincipal()).getId();
        return companyService.getCompanyByUser(userId);
    }

    @GetMapping("/company/workerCount")
    public int getWorkerCount(Authentication authentication){
        Long userId = ((User) authentication.getPrincipal()).getId();
        return companyService.getWorkerCountByUser(userId);
    }

    @GetMapping("/company/members")
    public List<UserResponse> getMembers(Authentication authentication){
        Long requesterId = ((User) authentication.getPrincipal()).getId();
        return companyService.getMembersByUser(requesterId);
    }
}
