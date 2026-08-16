package com.example.logis.services;

import com.example.logis.data.Company;
import com.example.logis.data.User;
import com.example.logis.dtos.AddUserToCompanyRequest;
import com.example.logis.dtos.CompanyResponse;
import com.example.logis.dtos.CreateCompanyRequest;
import com.example.logis.dtos.UserResponse;
import com.example.logis.exceptions.CompanyNotFoundException;
import com.example.logis.exceptions.UserNotFoundException;
import com.example.logis.repository.CompanyRepository;
import com.example.logis.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

@Service
public class CompanyService {
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;

    public CompanyService(CompanyRepository companyRepository, UserRepository userRepository){
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
    }

    public CompanyResponse getCompany(Long companyId){
        if(companyId == null || companyId < 1){
            throw new IllegalArgumentException("Id must be > 0");
        }
        Company company = companyRepository.findById(companyId).
                orElseThrow(() -> new CompanyNotFoundException(companyId));

        return new CompanyResponse(company.getId(), company.getName());
    }

    @Transactional
    public void addUserToCompany(AddUserToCompanyRequest request, Long companyId){
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new CompanyNotFoundException(companyId));
        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new UserNotFoundException(request.userId()));

        user.setCompany(company);
        if(request.manager()){
            company.getManagers().add(user);
        }
    }

    @Transactional
    public void makeManager(Long companyId, Long userId){
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new CompanyNotFoundException(companyId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        user.setCompany(company);
        company.getManagers().add(user);
    }

    @Transactional
    public CompanyResponse createCompany(CreateCompanyRequest request, User manager) {
        Company savedCompany = companyRepository.save(new Company(request.name(), manager));
        manager.setCompany(savedCompany);
        userRepository.save(manager);
        return new CompanyResponse(
                savedCompany.getId(),
                savedCompany.getName()
        );
    }
}
