package com.example.logis.services;

import com.example.logis.data.Company;
import com.example.logis.data.Project;
import com.example.logis.data.ProjectStatus;
import com.example.logis.data.ProjectWorker;
import com.example.logis.data.User;
import com.example.logis.data.Workplace;
import com.example.logis.dtos.CreateProjectRequest;
import com.example.logis.dtos.ProjectResponse;
import com.example.logis.dtos.UserResponse;
import com.example.logis.exceptions.ForbiddenActionException;
import com.example.logis.exceptions.ProjectNotFoundException;
import com.example.logis.exceptions.ResourceNotOwnedException;
import com.example.logis.repository.ProjectRepository;
import com.example.logis.repository.ProjectWorkerRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
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

        assignWorker(savedProject.getId(), creator.getId(), creator);
        return toResponse(savedProject);
    }

    public Project findProject(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ProjectNotFoundException(id));
    }

    public Optional<ProjectWorker> findProjectWorker(Long projectId, Long workerId) {
        return projectWorkerRepository.findByProject_IdAndWorker_Id(projectId, workerId);
    }

    public ProjectResponse getProject(long id) {
        return toResponse(findProject(id));
    }

    public List<ProjectResponse> getWorkplaceProjects(long workplaceId) {
        return projectRepository.findByWorkplace_Id(workplaceId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public List<ProjectResponse> getWorkplaceProjectsByWorkplaceIdAndUser(long workplaceId, User user) {
        Workplace workplace = workplaceService.findWorkplace(workplaceId);
        if(!workplace.getCompany().getUsers().contains(user)){
            throw new ForbiddenActionException("User " + user.getId() + " is not authorized to view projects of this workplace, because he is not part of the company.");
        }
        return getWorkplaceProjects(workplaceId);
    }

    @Transactional
    public ProjectResponse updateProjectStatus(long projectId, ProjectStatus status, User requester) {
        Project project = findProject(projectId);

        Company company = companyService.findCompany(requester.getCompany().getId());
        if(!company.getManagers().contains(requester)){
            throw new ForbiddenActionException("User " + requester.getId() + " is not authorized to change the project status, because he is not a manager.");
        }
        if(!project.getWorkplace().getCompany().getId().equals(company.getId())){
            throw new ResourceNotOwnedException("Project does not belong to the requester's company");
        }

        project.setProjectStatus(status);
        return toResponse(projectRepository.save(project));
    }

    private ProjectResponse toResponse(Project project) {
        return new ProjectResponse(
                project.getId(),
                project.getProjectName(),
                project.getStartDate(),
                project.getDeadline(),
                project.getWorkplace().getId(),
                project.getProjectStatus()
        );
    }

    @Transactional
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

        ProjectWorker projectWorker = projectWorkerRepository.findByProject_IdAndWorker_Id(projectId, workerId)
                .orElse(null);

        if(projectWorker != null){
            if(projectWorker.getEndDate() == null){
                throw new ForbiddenActionException("Worker " + workerId + " is already assigned to project " + projectId);
            }
            projectWorker.setEndDate(null);
            projectWorker.setAssignedAt(LocalDate.now());

            projectWorkerRepository.save(projectWorker);
            return;
        }
        projectWorkerRepository.save(new ProjectWorker(worker, project));
    }

    @Transactional
    public List<UserResponse> getProjectWorkersByProjectIdAndUser(Long id, User user) {
        Project project = findProject(id);
        if(!project.getWorkplace().getCompany().getUsers().contains(user)){
            throw new ForbiddenActionException("User " + user.getId() + " is not authorized to view workers of this project, because he is not part of the company.");
        }

        return projectWorkerRepository.findByProject_Id(id).stream()
                .filter(projectWorker -> projectWorker.getEndDate() == null)
                .map(projectWorker -> new UserResponse(
                        projectWorker.getWorker().getId(),
                        projectWorker.getWorker().getName(),
                        projectWorker.getWorker().getLastname(),
                        projectWorker.getWorker().getUsername(),
                        projectWorker.getWorker().getEmail(),
                        projectWorker.getWorker().getRole(),
                        projectWorker.getWorker().getCompany().getId()
                ))
                .toList();
    }

    @Transactional
    public void removeWorkerByProjectIdAndWorkerIdAndUser(Long projectId, long workerId, User requester) {
        Project project = findProject(projectId);

        if(workerId == requester.getId()){
            throw new ForbiddenActionException("User " + requester.getId() + " is not authorized to remove himself from the project.");
        }

        Company company = companyService.findCompany(requester.getCompany().getId());
        if(!company.getManagers().contains(requester)){
            throw new ForbiddenActionException("User " + requester.getId() + " is not authorized to remove workers, because he is not a manager.");
        }
        if(!project.getWorkplace().getCompany().getId().equals(company.getId())){
            throw new ResourceNotOwnedException("Project does not belong to the requester's company");
        }

        ProjectWorker projectWorker = projectWorkerRepository.findByProject_IdAndWorker_Id(projectId, workerId)
                .orElseThrow(() -> new ForbiddenActionException("Worker " + workerId + " is not assigned to project " + projectId));

        projectWorker.setEndDate(LocalDate.now());
        projectWorkerRepository.save(projectWorker);
    }
}
