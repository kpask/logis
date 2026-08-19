package com.example.logis.services;

import com.example.logis.data.Company;
import com.example.logis.data.User;
import com.example.logis.dtos.*;
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
    private final UserService userService;

    public CompanyService(CompanyRepository companyRepository, UserRepository userRepository, UserService userService){
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
        this.userService = userService;
    }

    public CompanyResponse getCompany(Long companyId){
        if(companyId == null || companyId < 1){
            throw new IllegalArgumentException("Id must be > 0");
        }
        Company company = companyRepository.findById(companyId).
                orElseThrow(() -> new CompanyNotFoundException(companyId));

        return new CompanyResponse(company.getId(), company.getName());
    }

    public Company findCompany(Long companyId){
        return companyRepository.findById(companyId)
                .orElseThrow(() -> new CompanyNotFoundException(companyId));
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
    public void makeCompanyManager(MakeCompanyManagerRequest request){
        Company company = findCompany(request.companyId());
        User newManager = userService.findUser(request.futureManagerId());
        User existingManager = userService.findUser(request.requesterId());

        if(company.getUsers().contains(newManager) || !company.getManagers().contains(existingManager)){
            return;
        }

        newManager.setCompany(company);
        company.getManagers().add(newManager);
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

    public int getWorkerCount(long companyId){
        findCompany(companyId);
        return userRepository.countByCompanyId(companyId);
    }
}
