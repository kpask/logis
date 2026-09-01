package com.example.logis.controllers;

import com.example.logis.data.User;
import com.example.logis.dtos.CompanyResponse;
import com.example.logis.dtos.CreateCompanyRequest;
import com.example.logis.dtos.MakeCompanyManagerRequest;
import com.example.logis.dtos.UserResponse;
import com.example.logis.services.CompanyService;
import jakarta.validation.Valid;
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

    @PostMapping("/companies")
    public CompanyResponse createCompany(@RequestBody @Valid CreateCompanyRequest request, Authentication authentication){
        User creator = (User) authentication.getPrincipal();
        return companyService.createCompany(request, creator);
    }

    @PostMapping("/companies/{id}/managers")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void promote(@PathVariable long id, @RequestBody @Valid MakeCompanyManagerRequest request, Authentication authentication){
        User promoter = (User) authentication.getPrincipal();
        companyService.makeCompanyManager(new MakeCompanyManagerRequest(
                promoter.getId(),
                id,
                request.futureManagerId()
        ));
    }

    @GetMapping("/companies/{id}")
    public CompanyResponse getCompany(@PathVariable long id){
        return companyService.getCompany(id);
    }

    @GetMapping("/companies/{id}/workerCount")
    public int getWorkerCount(@PathVariable long id){
        return companyService.getWorkerCount(id);
    }

    @GetMapping("/companies/{id}/members")
    public List<UserResponse> getMembers(@PathVariable long id, Authentication authentication){
        User requester = (User) authentication.getPrincipal();
        return companyService.getMembers(id, requester);
    }
}
