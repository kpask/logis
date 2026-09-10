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
import org.springframework.security.core.Authentication;
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
    public CompanyResponse createCompany(@RequestBody @Valid CreateCompanyRequest request, Authentication authentication){
        Long creatorId = ((User) authentication.getPrincipal()).getId();
        return companyService.createCompany(request, creatorId);
    }

    @GetMapping("/company/")
    public CompanyResponse getCompany(Authentication authentication){
        Long userId = ((User) authentication.getPrincipal()).getId();
        return companyService.getCompanyByUser(userId);
    }

    @PutMapping("/company/")
    public CompanyResponse editCompany(@RequestBody @Valid UpdateCompanyRequest request, Authentication authentication){
        Long userId = ((User) authentication.getPrincipal()).getId();
        return companyService.updateCompany(userId, request);
    }

    @PostMapping("/company/manager/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void promote(@PathVariable @Positive long id, Authentication authentication){
        Long promoterId = ((User) authentication.getPrincipal()).getId();
        companyService.makeCompanyManager(id, promoterId);
    }

    @DeleteMapping("/company/manager/{id}")
    public UserResponse demote(@PathVariable @Positive long id, Authentication authentication){
        Long promoterId = ((User) authentication.getPrincipal()).getId();
        return companyService.demote(id, promoterId);
    }

    @PutMapping("/owner/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void transferOwnership(@PathVariable @Positive long id, Authentication authentication){
        Long formerOwnerId = ((User) authentication.getPrincipal()).getId();
        companyService.transferOwnership(id, formerOwnerId);
    }

    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PostMapping("/company/kick/{id}")
    public void kick(Authentication authentication, @PathVariable @Positive long id){
        User user = (User) authentication.getPrincipal();
        companyService.kick(id, user.getId());
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

    @GetMapping("/company/settings")
    public CompanySettingsResponse getCompanySettings(Authentication authentication){
        Long requesterId = ((User) authentication.getPrincipal()).getId();
        return companySettingsService.getSettingsByUser(requesterId);
    }

    @PutMapping("/company/settings")
    public CompanySettingsResponse updateCompanySettings(@RequestBody @Valid UpdateCompanySettingsRequest request, Authentication authentication){
        Long requesterId = ((User) authentication.getPrincipal()).getId();
        return companySettingsService.updateSettingsByUser(requesterId, request);
    }
}
