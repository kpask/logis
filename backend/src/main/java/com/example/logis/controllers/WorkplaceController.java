package com.example.logis.controllers;

import com.example.logis.data.User;
import com.example.logis.dtos.*;
import com.example.logis.services.ProjectService;
import com.example.logis.services.WorkplaceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
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

    @PostMapping("/workplace")
    public WorkplaceResponse createWorkplace(@RequestBody @Valid CreateWorkplaceRequest request, Authentication authentication){
        Long creatorId = ((User) authentication.getPrincipal()).getId();
        return workplaceService.createWorkplace(request, creatorId);
    }

    @GetMapping("/workplaces")
    public List<WorkplaceResponse> getCompanyWorkplaces(Authentication authentication){
        Long userId = ((User) authentication.getPrincipal()).getId();
        return workplaceService.getWorkplacesByUser(userId);
    }

    @GetMapping("/workplaces/{id}")
    public WorkplaceResponse getWorkplace(@PathVariable long id, Authentication authentication){
        Long userId = ((User) authentication.getPrincipal()).getId();
        return workplaceService.getWorkplaceByWorkplaceIdAndUser(id, userId);
    }

    @GetMapping("/workplaces/{id}/projects")
    public List<ProjectResponse> getWorkplaceProjects(@PathVariable long id, Authentication authentication){
        Long userId = ((User) authentication.getPrincipal()).getId();
        return projectService.getWorkplaceProjectsByWorkplaceIdAndUser(id, userId);
    }

    @PutMapping("/workplaces/{id}")
    public WorkplaceResponse updateWorkplace(@PathVariable long id, @RequestBody @Valid UpdateWorkplaceRequest request, Authentication authentication){
        Long userId = ((User) authentication.getPrincipal()).getId();
        return workplaceService.updateWorkplace(id, userId, request);
    }

    @DeleteMapping("/workplaces/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteWorkplace(@PathVariable Long id, Authentication authentication){
        Long userId = ((User) authentication.getPrincipal()).getId();
        workplaceService.deleteWorkplaceByWorkplaceIdAndUser(id, userId);
    }
}