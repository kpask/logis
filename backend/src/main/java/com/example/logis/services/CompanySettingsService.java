package com.example.logis.services;

import com.example.logis.data.entities.Company;
import com.example.logis.data.entities.CompanySettings;
import com.example.logis.data.entities.User;
import com.example.logis.data.enums.CompanyRole;
import com.example.logis.dtos.requests.UpdateCompanySettingsRequest;
import com.example.logis.dtos.responses.CompanySettingsResponse;
import com.example.logis.exceptions.ForbiddenActionException;
import com.example.logis.repository.CompanyRepository;
import com.example.logis.repository.CompanySettingsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CompanySettingsService {
    private final CompanySettingsRepository companySettingsRepository;
    private final CompanyRepository companyRepository;
    private final UserService userService;

    public CompanySettingsService(CompanySettingsRepository companySettingsRepository, CompanyRepository companyRepository, UserService userService) {
        this.companySettingsRepository = companySettingsRepository;
        this.companyRepository = companyRepository;
        this.userService = userService;
    }

    @Transactional
    public CompanySettings getOrCreate(Long companyId) {
        return companySettingsRepository.findById(companyId)
                .orElseGet(() -> {
                    Company company = companyRepository.getReferenceById(companyId);
                    return companySettingsRepository.save(new CompanySettings(company));
                });
    }

    @Transactional(readOnly = true)
    public CompanySettingsResponse getSettingsForUser(Long requesterId) {
        return toResponse(getOrCreateForUser(requesterId));
    }

    @Transactional
    public CompanySettingsResponse updateSettingsForUser(Long requesterId, UpdateCompanySettingsRequest request) {
        User requester = userService.findUser(requesterId);
        if (requester.getCompany() == null) {
            throw new ForbiddenActionException("You can only manage settings of your own company.");
        }
        if (requester.getRole() == CompanyRole.USER) {
            throw new ForbiddenActionException("Only managers can update company settings.");
        }
        CompanySettings settings = getOrCreate(requester.getCompany().getId());
        settings.setDefaultLunchLength(request.defaultLunchLength() == null ? settings.getDefaultLunchLength(): request.defaultLunchLength());
        settings.setDefaultStartTime(request.defaultStartTime() == null ? settings.getDefaultStartTime() : request.defaultStartTime());
        settings.setDefaultEndTime(request.defaultEndTime() == null ? settings.getDefaultEndTime() : request.defaultEndTime());
        return toResponse(companySettingsRepository.save(settings));
    }

    private CompanySettings getOrCreateForUser(Long requesterId) {
        User requester = userService.findUser(requesterId);
        if (requester.getCompany() == null) {
            throw new ForbiddenActionException("You can only view settings of your own company.");
        }
        return getOrCreate(requester.getCompany().getId());
    }

    public CompanySettingsResponse toResponse(CompanySettings settings) {
        return new CompanySettingsResponse(
                settings.getDefaultLunchLength(),
                settings.getDefaultStartTime(),
                settings.getDefaultEndTime()
        );
    }
}
