package com.example.logis.services;

import com.example.logis.data.entities.Company;
import com.example.logis.data.enums.CompanyRole;
import com.example.logis.data.entities.User;
import com.example.logis.dtos.requests.CreateCompanyRequest;
import com.example.logis.dtos.requests.AddUserToCompanyRequest;
import com.example.logis.dtos.requests.UpdateCompanyRequest;
import com.example.logis.dtos.responses.CompanyResponse;
import com.example.logis.dtos.responses.UserResponse;
import com.example.logis.exceptions.CompanyNotFoundException;
import com.example.logis.exceptions.ForbiddenActionException;
import com.example.logis.exceptions.UserNotFoundException;
import com.example.logis.repository.CompanyRepository;
import com.example.logis.repository.ProjectWorkerRepository;
import com.example.logis.repository.UserRepository;
import com.example.logis.util.AuthorizationHelper;
import jakarta.validation.constraints.Positive;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CompanyService {
    private final CompanyRepository companyRepository;
    private final ProjectWorkerRepository projectWorkerRepository;
    private final UserRepository userRepository;
    private final UserService userService;

    public CompanyService(CompanyRepository companyRepository, UserRepository userRepository, UserService userService, ProjectWorkerRepository projectWorkerRepository){
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
        this.userService = userService;
        this.projectWorkerRepository = projectWorkerRepository;
    }

    public CompanyResponse getCompanyById(Long companyId){
        if(companyId == null || companyId < 1){
            throw new IllegalArgumentException("Id must be > 0");
        }
        Company company = companyRepository.findById(companyId).
                orElseThrow(() -> new CompanyNotFoundException(companyId));

        return toResponse(company);
    }

    @Transactional(readOnly = true)
    public CompanyResponse getCompanyForUser(Long userId){
        User user = userService.findUser(userId);
        if(user.getCompany() == null){
            throw new IllegalArgumentException("User is not associated with any company");
        }
        return toResponse(user.getCompany());
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
        if(promoter.getId().equals(newManager.getId())){
            throw new IllegalArgumentException("You cannot change your role.");
        }
        if(!promoter.getRole().equals(CompanyRole.OWNER)){
            throw new ForbiddenActionException("Only owners can promote users to manager role");
        }
        if(!AuthorizationHelper.areUsersPartOfSameCompany(promoter, newManager)){
            throw new ForbiddenActionException("Requester and new manager must belong to the same company");
        }
        newManager.setRole(CompanyRole.MANAGER);
    }

    @Transactional
    public CompanyResponse createCompany(CreateCompanyRequest request, Long managerId) {
        User creator = userService.findUser(managerId);
        if(creator.getCompany() != null){
            throw new IllegalArgumentException("User is already in a company");
        }

        Company savedCompany = companyRepository.save(new Company(request.name()));
        creator.setCompany(savedCompany);
        creator.setRole(CompanyRole.OWNER);
        userRepository.save(creator);
        return toResponse(savedCompany);
    }

    public int getWorkerCountByCompanyId(long companyId){
        return userRepository.countByCompanyId(companyId);
    }

    @Transactional(readOnly = true)
    public int getWorkerCountForUser(Long userId){
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

    private CompanyResponse toResponse(Company company) {
        return new CompanyResponse(company.getId(), company.getName());
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getMembersForUser(Long requesterId) {
        User requester = userService.findUser(requesterId);
        if (requester.getCompany() == null) {
            throw new ForbiddenActionException("You can only view members of your own company.");
        }
        return userRepository.findByCompanyId(requester.getCompany().getId()).stream()
                .map(userService::toResponse)
                .toList();
    }

    @Transactional
    public void kick(@Positive long kickedId, Long kickerId) {
        User kicked = userService.findUser(kickedId);
        User kicker = userService.findUser(kickerId);
        if(!kicker.getRole().equals(CompanyRole.OWNER)){
            throw new ForbiddenActionException("Kicker " + kickerId + " is not authorized to kick others.");
        }
        if(kicker.equals(kicked)){
            throw new IllegalArgumentException("Kicker cannot kick himself");
        }
        if(!AuthorizationHelper.areUsersPartOfSameCompany(kicked, kicker)) {
            throw new IllegalArgumentException("One or both users are not associated with a company");
        }

        kicked.setCompany(null);
        kicked.setRole(CompanyRole.USER);
        projectWorkerRepository.deleteAll(projectWorkerRepository.findByWorker_Id(kicked.getId()));
    }

    @Transactional
    public UserResponse demote(@Positive long demotedUserId, Long promoterId) {
        User demoted = userService.findUser(demotedUserId);
        User demoter = userService.findUser(promoterId);
        if(!demoter.getRole().equals(CompanyRole.OWNER)){
            throw new ForbiddenActionException("Only owners can demote.");
        }
        if(demoted.equals(demoter)){
            throw new IllegalArgumentException("You cannot demote yourself");
        }
        if(!AuthorizationHelper.areUsersPartOfSameCompany(demoted, demoter)) {
            throw new ForbiddenActionException("You must both be part of the same company");
        }
        demoted.setRole(CompanyRole.USER);
        return userService.toResponse(demoted);
    }

    @Transactional
    public void transferOwnership(@Positive long newOwnerId, @Positive long formerOwnerId) {
        User oldOwner = userService.findUser(formerOwnerId);
        User newOwner = userService.findUser(newOwnerId);

        if(!oldOwner.getRole().equals(CompanyRole.OWNER)){
            throw new ForbiddenActionException("You are not the owner of your company");
        }
        if(!AuthorizationHelper.areUsersPartOfSameCompany(oldOwner, newOwner)){
            throw new IllegalArgumentException("You cannot transfer ownership to a non company member.");
        }

        oldOwner.setRole(CompanyRole.MANAGER);
        newOwner.setRole(CompanyRole.OWNER);
    }

    @Transactional
    public CompanyResponse updateCompany(Long userId, UpdateCompanyRequest request) {
        User user = userService.findUser(userId);
        if(!AuthorizationHelper.isManagerOrHigherOfCompany(user, user.getCompany())){
            throw new ForbiddenActionException("Non owners can't update company settings");
        }
        Company company = user.getCompany();
        company.setName(request.name());
        return toResponse(companyRepository.save(company));
    }
}
