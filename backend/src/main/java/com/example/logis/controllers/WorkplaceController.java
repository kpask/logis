package com.example.logis.controllers;

import com.example.logis.data.entities.User;
import com.example.logis.dtos.requests.CreateWorkplaceRequest;
import com.example.logis.dtos.responses.ProjectResponse;
import com.example.logis.dtos.requests.UpdateWorkplaceRequest;
import com.example.logis.dtos.responses.WorkplaceResponse;
import com.example.logis.services.ProjectService;
import com.example.logis.services.WorkplaceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class WorkplaceController {
    private final WorkplaceService workplaceService;
    private final ProjectService projectService;

    public WorkplaceController(WorkplaceService workplaceService, ProjectService projectService){
        this.workplaceService = workplaceService;
        this.projectService = projectService;
    }

    @PostMapping("/workplaces")
    public WorkplaceResponse createWorkplace(@RequestBody @Valid CreateWorkplaceRequest request, @AuthenticationPrincipal User user){
        return workplaceService.createWorkplace(request, user.getId());
    }

    @GetMapping("/workplaces")
    public List<WorkplaceResponse> getCompanyWorkplaces(@AuthenticationPrincipal User user){
        return workplaceService.getWorkplacesForUser(user.getId());
    }

    @GetMapping("/workplaces/{id}")
    public WorkplaceResponse getWorkplace(@PathVariable long id, @AuthenticationPrincipal User user){
        return workplaceService.getWorkplaceForUser(id, user.getId());
    }

    @GetMapping("/workplaces/{id}/projects")
    public List<ProjectResponse> getWorkplaceProjects(@PathVariable long id, @AuthenticationPrincipal User user){
        return projectService.getWorkplaceProjectsForUser(id, user.getId());
    }

    @PutMapping("/workplaces/{id}")
    public WorkplaceResponse updateWorkplace(@PathVariable long id, @RequestBody @Valid UpdateWorkplaceRequest request, @AuthenticationPrincipal User user){
        return workplaceService.updateWorkplace(id, user.getId(), request);
    }

    @DeleteMapping("/workplaces/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteWorkplace(@PathVariable Long id, @AuthenticationPrincipal User user){
        workplaceService.deleteWorkplaceForUser(id, user.getId());
    }
}
