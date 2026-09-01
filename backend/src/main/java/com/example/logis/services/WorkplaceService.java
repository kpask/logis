package com.example.logis.services;

import com.example.logis.data.Company;
import com.example.logis.data.User;
import com.example.logis.data.Workplace;
import com.example.logis.dtos.CreateWorkplaceRequest;
import com.example.logis.dtos.WorkplaceResponse;
import com.example.logis.exceptions.ForbiddenActionException;
import com.example.logis.exceptions.WorkplaceNotFoundException;
import com.example.logis.repository.WorkplaceRepository;
import jakarta.transaction.Transactional;
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
    public WorkplaceResponse createWorkplace(CreateWorkplaceRequest request, User manager) {
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
                company
        );

        Workplace savedWorkplace = workplaceRepository.save(workplace);
        return new WorkplaceResponse(
                savedWorkplace.getId(),
                savedWorkplace.getName(),
                savedWorkplace.getLocation(),
                savedWorkplace.getCompany().getId()
        );
    }

    public Workplace findWorkplace(Long workplaceId){
        return workplaceRepository.findById(workplaceId)
                .orElseThrow(() -> new WorkplaceNotFoundException(workplaceId));
    }

    @Transactional
    public List<WorkplaceResponse> getWorkplacesByUser(User authenticatedUser) {
        User dbUser = userService.findUser(authenticatedUser.getId());
        return dbUser.getCompany().getWorkplaces().stream()
                .map(workplace -> new WorkplaceResponse(
                        workplace.getId(),
                        workplace.getName(),
                        workplace.getLocation(),
                        workplace.getCompany().getId()
                )).toList();
    }

    @Transactional
    public List<WorkplaceResponse> getWorkplacesByCompanyId(long id) {
        return companyService.findCompany(id).getWorkplaces().stream()
                .map(workplace -> new WorkplaceResponse(
                        workplace.getId(),
                        workplace.getName(),
                        workplace.getLocation(),
                        workplace.getCompany().getId()
                )).toList();
    }

    public WorkplaceResponse getWorkplaceByWorkplaceId(Long id) {
        Workplace workplace = findWorkplace(id);
        return new WorkplaceResponse(
                workplace.getId(),
                workplace.getName(),
                workplace.getLocation(),
                workplace.getCompany().getId()
        );
    }

    public WorkplaceResponse getWorkplaceByWorkplaceIdAndUser(Long id, User user) {
        Workplace workplace = findWorkplace(id);
        if (!workplace.getCompany().getId().equals(user.getCompany().getId())) {
            throw new ForbiddenActionException("User " + user.getId() + " is not part of the company that owns workplace " + id);
        }

        return new WorkplaceResponse(
                workplace.getId(),
                workplace.getName(),
                workplace.getLocation(),
                workplace.getCompany().getId()
        );
    }

    public void deleteWorkplaceByWorkplaceId(Long id) {
        Workplace workplace = findWorkplace(id);
        workplaceRepository.delete(workplace);
    }

    @Transactional
    public void deleteWorkplaceByWorkplaceIdAndUser(Long id, User user) {
        Workplace workplace = findWorkplace(id);
        if(!workplace.getCompany().getId().equals(user.getCompany().getId())){
            throw new ForbiddenActionException("User " + user.getId() + " is not part of the company that owns workplace " + id);
        }
        workplaceRepository.delete(workplace);
    }
}