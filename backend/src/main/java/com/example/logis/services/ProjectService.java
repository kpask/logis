package com.example.logis.services;

import com.example.logis.data.Company;
import com.example.logis.data.Project;
import com.example.logis.data.ProjectWorker;
import com.example.logis.data.User;
import com.example.logis.data.Workplace;
import com.example.logis.dtos.CreateProjectRequest;
import com.example.logis.dtos.ProjectResponse;
import com.example.logis.exceptions.ForbiddenActionException;
import com.example.logis.exceptions.ProjectNotFoundException;
import com.example.logis.exceptions.ResourceNotOwnedException;
import com.example.logis.repository.ProjectRepository;
import com.example.logis.repository.ProjectWorkerRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ProjectService {
    private final ProjectRepository projectRepository;
    private final ProjectWorkerRepository projectWorkerRepository;
    private final CompanyService companyService;
    private final WorkplaceService workplaceService;
    private final UserService userService;

    public ProjectService(ProjectRepository projectRepository, ProjectWorkerRepository projectWorkerRepository,
                          CompanyService companyService, WorkplaceService workplaceService, UserService userService){
        this.projectRepository = projectRepository;
        this.projectWorkerRepository = projectWorkerRepository;
        this.companyService = companyService;
        this.workplaceService = workplaceService;
        this.userService = userService;
    }

    @Transactional
    public ProjectResponse createProject(CreateProjectRequest request, User creator) {
        Company company = companyService.findCompany(creator.getCompany().getId());
        Workplace workplace = workplaceService.findWorkplace(request.workplaceId());

        if(!company.getManagers().contains(creator)){
            throw new ForbiddenActionException("User " + creator.getId() + " is not authorized to create projects, because he is not a manager.");
        }
        if(!workplace.getCompany().getId().equals(company.getId())){
            throw new ResourceNotOwnedException("Workplace does not belong to the creator's company");
        }

        Project savedProject = projectRepository.save(new Project(
                request.projectName(),
                workplace,
                request.startDate(),
                request.deadline()
        ));

        return new ProjectResponse(
                savedProject.getId(),
                savedProject.getProjectName(),
                savedProject.getStartDate(),
                savedProject.getDeadline(),
                savedProject.getWorkplace().getId()
        );
    }

    public Project findProject(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ProjectNotFoundException(id));
    }

    public Optional<ProjectWorker> findProjectWorker(Long projectId, Long workerId) {
        return projectWorkerRepository.findByProject_IdAndWorker_Id(projectId, workerId);
    }

    public ProjectResponse getProject(long id) {
        Project project = findProject(id);
        return new ProjectResponse(
                project.getId(),
                project.getProjectName(),
                project.getStartDate(),
                project.getDeadline(),
                project.getWorkplace().getId()
        );
    }

    public List<ProjectResponse> getWorkplaceProjects(long workplaceId) {
        return projectRepository.findByWorkplace_Id(workplaceId).stream()
                .map(project -> new ProjectResponse(
                        project.getId(),
                        project.getProjectName(),
                        project.getStartDate(),
                        project.getDeadline(),
                        project.getWorkplace().getId()
                ))
                .toList();
    }

    public void assignWorker(long projectId, long workerId, User assigner) {
        Project project = findProject(projectId);
        User worker = userService.findUser(workerId);

        Company company = companyService.findCompany(assigner.getCompany().getId());
        if(!company.getManagers().contains(assigner)){
            throw new ForbiddenActionException("User " + assigner.getId() + " is not authorized to assign workers, because he is not a manager.");
        }
        if(!project.getWorkplace().getCompany().getId().equals(company.getId())){
            throw new ResourceNotOwnedException("Project does not belong to the assigner's company");
        }

        projectWorkerRepository.save(new ProjectWorker(worker, project));
    }
}