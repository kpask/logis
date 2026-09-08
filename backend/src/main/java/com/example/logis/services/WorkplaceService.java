package com.example.logis.services;

import com.example.logis.data.Company;
import com.example.logis.data.User;
import com.example.logis.data.Workplace;
import com.example.logis.data.enums.CompanyRole;
import com.example.logis.dtos.CreateWorkplaceRequest;
import com.example.logis.dtos.UpdateWorkplaceRequest;
import com.example.logis.dtos.WorkplaceResponse;
import com.example.logis.exceptions.ForbiddenActionException;
import com.example.logis.exceptions.WorkplaceNotFoundException;
import com.example.logis.repository.WorkplaceRepository;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class WorkplaceService {
    private final WorkplaceRepository workplaceRepository;
    private final CompanyService companyService;
    private final UserService userService;

    public WorkplaceService(WorkplaceRepository workplaceRepository, CompanyService companyService, UserService userService){
        this.workplaceRepository = workplaceRepository;
        this.companyService = companyService;
        this.userService = userService;
    }

    @Transactional
    public WorkplaceResponse createWorkplace(CreateWorkplaceRequest request, Long managerId) {
        User manager = userService.findUser(managerId);
        if(manager.getCompany() == null){
            throw new ForbiddenActionException("User " + manager.getId() + " is not part of any company");
        }

        Company company = companyService.findCompany(manager.getCompany().getId());
        if(!company.getManagers().contains(manager)){
            throw new ForbiddenActionException("User " + manager.getId() + " is not a manager of company " + company.getId());
        }


        Workplace workplace = new Workplace(
                request.name(),
                request.location(),
                company,
                request.radiusDistance() != null ? request.radiusDistance() : 150.0
        );

        Workplace savedWorkplace = workplaceRepository.save(workplace);
        return new WorkplaceResponse(
                savedWorkplace.getId(),
                savedWorkplace.getName(),
                savedWorkplace.getLocation(),
                savedWorkplace.getCompany().getId(),
                savedWorkplace.getRadiusMeters()
        );
    }

    public Workplace findWorkplace(Long workplaceId){
        return workplaceRepository.findById(workplaceId)
                .orElseThrow(() -> new WorkplaceNotFoundException(workplaceId));
    }

    @Transactional
    public List<WorkplaceResponse> getWorkplacesByUser(Long userId) {
        User authenticatedUser = userService.findUser(userId);

        if(authenticatedUser.getCompany() == null){
            throw new ForbiddenActionException("User " + authenticatedUser.getId() + " is not part of any company");
        }

        return authenticatedUser.getCompany().getWorkplaces().stream()
                .map(workplace -> new WorkplaceResponse(
                        workplace.getId(),
                        workplace.getName(),
                        workplace.getLocation(),
                        workplace.getCompany().getId(),
                        workplace.getRadiusMeters()
                )).toList();
    }

    @Transactional
    public List<WorkplaceResponse> getWorkplacesByCompanyId(long id) {
        return companyService.findCompany(id).getWorkplaces().stream()
                .map(workplace -> new WorkplaceResponse(
                        workplace.getId(),
                        workplace.getName(),
                        workplace.getLocation(),
                        workplace.getCompany().getId(),
                        workplace.getRadiusMeters()
                )).toList();
    }

    public WorkplaceResponse getWorkplaceByWorkplaceId(Long id) {
        Workplace workplace = findWorkplace(id);
        return new WorkplaceResponse(
                workplace.getId(),
                workplace.getName(),
                workplace.getLocation(),
                workplace.getCompany().getId(),
                workplace.getRadiusMeters()
        );
    }

    public WorkplaceResponse getWorkplaceByWorkplaceIdAndUser(Long id, Long userId) {
        User user = userService.findUser(userId);
        Workplace workplace = findWorkplace(id);
        if (!workplace.getCompany().getId().equals(user.getCompany().getId())) {
            throw new ForbiddenActionException("User " + user.getId() + " is not part of the company that owns workplace " + id);
        }

        return new WorkplaceResponse(
                workplace.getId(),
                workplace.getName(),
                workplace.getLocation(),
                workplace.getCompany().getId(),
                workplace.getRadiusMeters()
        );
    }

    @Transactional
    public WorkplaceResponse updateWorkplace(long workplaceId, long userId, UpdateWorkplaceRequest request) {
        User user = userService.findUser(userId);
        Workplace workplace = findWorkplace(workplaceId);

        if(user.getRole().equals(CompanyRole.USER) || !workplace.getCompany().getUsers().contains(user)) {
            throw new ForbiddenActionException("User " + user.getId() + " is not authorized to update workplace " + workplaceId);
        }


        workplace.setName(request.name() == null ? workplace.getName() : request.name());
        workplace.setLocation(request.location() == null ? workplace.getLocation() : request.location());
        workplace.setRadiusMeters(request.radiusDistance() == null || request.radiusDistance() < 1 ? workplace.getRadiusMeters() : request.radiusDistance());

        Workplace updatedWorkplace = workplaceRepository.save(workplace);
        return new WorkplaceResponse(
                updatedWorkplace.getId(),
                updatedWorkplace.getName(),
                updatedWorkplace.getLocation(),
                updatedWorkplace.getCompany().getId(),
                updatedWorkplace.getRadiusMeters()
        );
    }

    @Transactional
    public void deleteWorkplaceByWorkplaceIdAndUser(Long id, Long userId) {
        User user = userService.findUser(userId);
        Workplace workplace = findWorkplace(id);
        if(user.getRole().equals(CompanyRole.USER) || !workplace.getCompany().getUsers().contains(user)) {
            throw new ForbiddenActionException("User " + user.getId() + " is not allowed to edit project " + workplace.getId());
        }
        workplaceRepository.delete(workplace);
    }
}