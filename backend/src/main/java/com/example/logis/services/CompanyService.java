package com.example.logis.services;

import com.example.logis.data.Company;
import com.example.logis.data.enums.CompanyRole;
import com.example.logis.data.User;
import com.example.logis.dtos.*;
import com.example.logis.exceptions.CompanyNotFoundException;
import com.example.logis.exceptions.ForbiddenActionException;
import com.example.logis.exceptions.UserNotFoundException;
import com.example.logis.repository.CompanyRepository;
import com.example.logis.repository.ProjectWorkerRepository;
import com.example.logis.repository.TimeTrackingRepository;
import com.example.logis.repository.UserRepository;
import jakarta.transaction.Transactional;
import jakarta.validation.constraints.Positive;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Service
public class CompanyService {
    private final CompanyRepository companyRepository;
    private final ProjectWorkerRepository projectWorkerRepository;
    private final TimeTrackingRepository timeTrackingRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    public CompanyService(CompanyRepository companyRepository, UserRepository userRepository, UserService userService, ProjectWorkerRepository projectWorkerRepository, TimeTrackingRepository timeTrackingRepository){
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
        this.userService = userService;
        this.projectWorkerRepository = projectWorkerRepository;
        this.timeTrackingRepository = timeTrackingRepository;
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
        if(promoter.getCompany() == null || newManager.getCompany() == null || !promoter.getCompany().getId().equals(newManager.getCompany().getId())){
            throw new ForbiddenActionException("Requester and new manager must belong to the same company");
        }
        newManager.setRole(CompanyRole.MANAGER);
    }

    @Transactional
    public CompanyResponse createCompany(CreateCompanyRequest request, Long managerId) {
        User manager = userService.findUser(managerId);
        Company savedCompany = companyRepository.save(new Company(request.name()));
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

    @Transactional
    public List<UserResponse> getFormerMembersByUser(Long requesterId) {
        User requester = userService.findUser(requesterId);
        if (requester.getCompany() == null || requester.getCompany().getId() == null) {
            throw new ForbiddenActionException("You can only view former members of your own company.");
        }
        if (!requester.getRole().equals(CompanyRole.MANAGER)) {
            throw new ForbiddenActionException("Only managers can view former company members.");
        }
        return projectWorkerRepository
                .findFormerMembersByCompanyId(requester.getCompany().getId())
                .stream()
                .map(userService::toResponse)
                .toList();
    }

    @Transactional
    public void kick(@Positive long kickedId, Long kickerId) {
        User kicked = userService.findUser(kickedId);
        User kicker = userService.findUser(kickerId);
        if(!kicker.getRole().equals(CompanyRole.MANAGER)){
            throw new ForbiddenActionException("Kicker " + kickerId + " is not a manager");
        }
        if(kicker.equals(kicked)){
            throw new IllegalArgumentException("Kicker cannot kick himself");
        }
        if(kicked.getCompany() == null || kicker.getCompany() == null) {
            throw new IllegalArgumentException("One or both users are not associated with a company");
        }
        if(!kicked.getCompany().getId().equals(kicker.getCompany().getId())){
            throw new IllegalArgumentException("User is not associated with the same company");
        }

        kicked.setCompany(null);
        kicked.setRole(CompanyRole.USER);
        projectWorkerRepository.kickUserFromProjects(kickedId, LocalDate.now());
        timeTrackingRepository.findActiveTimeEntry(kickedId).ifPresent(timeEntry -> {
            timeEntry.setEndTime(Instant.now());
            timeTrackingRepository.save(timeEntry);
        });
    }
}
