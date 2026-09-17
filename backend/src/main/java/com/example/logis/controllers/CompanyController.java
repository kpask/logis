package com.example.logis.controllers;

import com.example.logis.data.entities.User;
import com.example.logis.dtos.requests.UpdateCompanyRequest;
import com.example.logis.dtos.requests.UpdateCompanySettingsRequest;
import com.example.logis.dtos.responses.CompanyResponse;
import com.example.logis.dtos.responses.CompanySettingsResponse;
import com.example.logis.dtos.requests.CreateCompanyRequest;
import com.example.logis.dtos.responses.UserResponse;
import com.example.logis.services.CompanyService;
import com.example.logis.services.CompanySettingsService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class CompanyController {
    private final CompanyService companyService;
    private final CompanySettingsService companySettingsService;

    public CompanyController(CompanyService companyService, CompanySettingsService companySettingsService){
        this.companyService = companyService;
        this.companySettingsService = companySettingsService;
    }

    @PostMapping("/company")
    public CompanyResponse createCompany(@RequestBody @Valid CreateCompanyRequest request, @AuthenticationPrincipal User user){
        return companyService.createCompany(request, user.getId());
    }

    @GetMapping("/company")
    public CompanyResponse getCompany(@AuthenticationPrincipal User user){
        return companyService.getCompanyForUser(user.getId());
    }

    @PutMapping("/company")
    public CompanyResponse editCompany(@RequestBody @Valid UpdateCompanyRequest request, @AuthenticationPrincipal User user){
        return companyService.updateCompany(user.getId(), request);
    }

    @PostMapping("/company/manager/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void promote(@PathVariable @Positive long id, @AuthenticationPrincipal User user){
        companyService.makeCompanyManager(id, user.getId());
    }

    @DeleteMapping("/company/manager/{id}")
    public UserResponse demote(@PathVariable @Positive long id, @AuthenticationPrincipal User user){
        return companyService.demote(id, user.getId());
    }

    @PutMapping("/company/owner/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void transferOwnership(@PathVariable @Positive long id, @AuthenticationPrincipal User user){
        companyService.transferOwnership(id, user.getId());
    }

    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PostMapping("/company/kick/{id}")
    public void kick(@PathVariable @Positive long id, @AuthenticationPrincipal User user){
        companyService.kick(id, user.getId());
    }

    @GetMapping("/company/worker-count")
    public int getWorkerCount(@AuthenticationPrincipal User user){
        return companyService.getWorkerCountForUser(user.getId());
    }

    @GetMapping("/company/members")
    public List<UserResponse> getMembers(@AuthenticationPrincipal User user){
        return companyService.getMembersForUser(user.getId());
    }

    @GetMapping("/company/settings")
    public CompanySettingsResponse getCompanySettings(@AuthenticationPrincipal User user){
        return companySettingsService.getSettingsForUser(user.getId());
    }

    @PutMapping("/company/settings")
    public CompanySettingsResponse updateCompanySettings(@RequestBody @Valid UpdateCompanySettingsRequest request, @AuthenticationPrincipal User user){
        return companySettingsService.updateSettingsForUser(user.getId(), request);
    }
}
