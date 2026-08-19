package com.example.logis.services;

import com.example.logis.data.Company;
import com.example.logis.data.User;
import com.example.logis.data.Workplace;
import com.example.logis.dtos.CreateWorkplaceRequest;
import com.example.logis.dtos.ProjectResponse;
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

    public WorkplaceService(WorkplaceRepository workplaceRepository, CompanyService companyService){
        this.workplaceRepository = workplaceRepository;
        this.companyService = companyService;
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
    public List<WorkplaceResponse> getWorkplaces(long id) {
        return companyService.findCompany(id).getWorkplaces().stream()
                .map(workplace -> new WorkplaceResponse(
                        workplace.getId(),
                        workplace.getName(),
                        workplace.getLocation(),
                        workplace.getCompany().getId()
                )).toList();
    }

    public WorkplaceResponse getWorkplace(Long id) {
        Workplace workplace = findWorkplace(id);
        return new WorkplaceResponse(
                workplace.getId(),
                workplace.getName(),
                workplace.getLocation(),
                workplace.getCompany().getId()
        );
    }

    public void deleteWorkplace(Long id) {
        Workplace workplace = findWorkplace(id);
        workplaceRepository.delete(workplace);
    }
}