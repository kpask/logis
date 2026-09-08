package com.example.logis.controllers;

import com.example.logis.data.User;
import com.example.logis.dtos.*;
import com.example.logis.services.ProjectService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class ProjectController {
    private final ProjectService projectService;

    public ProjectController(ProjectService projectService){
        this.projectService = projectService;
    }

    @PostMapping("/project")
    public ProjectResponse createProject(@RequestBody @Valid CreateProjectRequest request, Authentication authentication){
        Long creatorId = ((User) authentication.getPrincipal()).getId();
        return projectService.createProject(request, creatorId);
    }

    @GetMapping("/project/{id}")
    public ProjectResponse getProject(@PathVariable long id, Authentication authentication){
        Long userId = ((User) authentication.getPrincipal()).getId();
        return projectService.getProjectByProjectIdAntUser(id, userId);
    }

    @PutMapping("/project/{id}")
    public ProjectResponse updateProject(@PathVariable long id, @RequestBody @Valid UpdateProjectRequest request, Authentication authentication){
        Long userId = ((User) authentication.getPrincipal()).getId();
        return projectService.updateProject(id, userId, request);
    }

    @DeleteMapping("/project/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProject(@PathVariable long id, Authentication authentication){
        Long userId = ((User) authentication.getPrincipal()).getId();
        projectService.deleteProject(id, userId);
    }

    @PostMapping("/project/{id}/assign/{workerId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void assignWorker(@PathVariable long id, @PathVariable long workerId, Authentication authentication){
        Long assignerId = ((User) authentication.getPrincipal()).getId();
        projectService.assignWorker(id, workerId, assignerId);
    }

    @PostMapping("/project/{id}/status")
    public ProjectResponse updateStatus(@PathVariable long id, @RequestBody @Valid UpdateProjectStatusRequest request, Authentication authentication){
        Long requesterId = ((User) authentication.getPrincipal()).getId();
        return projectService.updateProjectStatus(id, request.status(), requesterId);
    }

    @GetMapping("/project/{id}/workers")
    public List<UserResponse> getProjectWorkers(@PathVariable long id, Authentication authentication) {
        Long userId = ((User) authentication.getPrincipal()).getId();
        return projectService.getProjectWorkersByProjectIdAndUser(id, userId);
    }

    @DeleteMapping("/project/{id}/workers/{workerId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeWorker(@PathVariable long id, @PathVariable long workerId, Authentication authentication) {
        Long requesterId = ((User) authentication.getPrincipal()).getId();
        projectService.removeWorkerByProjectIdAndWorkerIdAndUser(id, workerId, requesterId);
    }
}
