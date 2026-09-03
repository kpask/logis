package com.example.logis.services;

import com.example.logis.data.Company;
import com.example.logis.data.CompanyRole;
import com.example.logis.data.User;
import com.example.logis.dtos.*;
import com.example.logis.exceptions.CompanyNotFoundException;
import com.example.logis.exceptions.ForbiddenActionException;
import com.example.logis.exceptions.UserNotFoundException;
import com.example.logis.repository.CompanyRepository;
import com.example.logis.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;

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

    public CompanyResponse getCompanyById(Long companyId){
        if(companyId == null || companyId < 1){
            throw new IllegalArgumentException("Id must be > 0");
        }
        Company company = companyRepository.findById(companyId).
                orElseThrow(() -> new CompanyNotFoundException(companyId));

        return new CompanyResponse(company.getId(), company.getName());
    }

    @Transactional
    public CompanyResponse getCompanyByUser(Long userId){
        User user = userService.findUser(userId);
        if(user.getCompany() == null){
            throw new IllegalArgumentException("User is not associated with any company");
        }
        return new CompanyResponse(user.getCompany().getId(), user.getCompany().getName());
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
            user.setRole(CompanyRole.MANAGER);
        } else {
            user.setRole(CompanyRole.USER);
        }
    }

    @Transactional
    public void makeCompanyManager(Long id, Long promoterId){
        User promoter = userService.findUser(promoterId);
        User newManager = userService.findUser(id);
        if(!promoter.getRole().equals(CompanyRole.MANAGER)){
            throw new ForbiddenActionException("Only managers can promote users to manager role");
        }
        if(promoter.getCompany() == null || !promoter.getCompany().getId().equals(newManager.getCompany().getId())){
            throw new ForbiddenActionException("Requester and new manager must belong to the same company");
        }
        promoter.getCompany().getManagers().add(newManager);
        newManager.setRole(CompanyRole.MANAGER);
    }

    @Transactional
    public CompanyResponse createCompany(CreateCompanyRequest request, Long managerId) {
        User manager = userService.findUser(managerId);
        Company savedCompany = companyRepository.save(new Company(request.name(), manager));
        manager.setCompany(savedCompany);
        manager.setRole(CompanyRole.MANAGER);
        userRepository.save(manager);
        return new CompanyResponse(
                savedCompany.getId(),
                savedCompany.getName()
        );
    }

    public int getWorkerCountByCompanyId(long companyId){
        return userRepository.countByCompanyId(companyId);
    }

    public int getWorkerCountByUser(Long userId){
        User user = userService.findUser(userId);
        if(user.getCompany() == null){
            throw new IllegalArgumentException("User is not associated with any company");
        }
        return userRepository.countByCompanyId(user.getCompany().getId());
    }

    public List<UserResponse> getMembers(long companyId) {
        Company company = findCompany(companyId);
        return userRepository.findByCompanyId(companyId).stream()
                .map(userService::toResponse)
                .toList();
    }

    @Transactional
    public List<UserResponse> getMembersByUser(Long requesterId) {
        User requester = userService.findUser(requesterId);
        if (requester.getCompany() == null || requester.getCompany().getId() == null) {
            throw new ForbiddenActionException("You can only view members of your own company.");
        }
        return userRepository.findByCompanyId(requester.getCompany().getId()).stream()
                .map(userService::toResponse)
                .toList();
    }
}
