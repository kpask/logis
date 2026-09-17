package com.example.logis.controllers;

import com.example.logis.data.entities.User;
import com.example.logis.dtos.requests.CreateProjectRequest;
import com.example.logis.dtos.responses.ProjectResponse;
import com.example.logis.dtos.requests.UpdateProjectRequest;
import com.example.logis.dtos.requests.UpdateProjectStatusRequest;
import com.example.logis.dtos.responses.UserResponse;
import com.example.logis.services.ProjectService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class ProjectController {
    private final ProjectService projectService;

    public ProjectController(ProjectService projectService){
        this.projectService = projectService;
    }

    @PostMapping("/projects")
    public ProjectResponse createProject(@RequestBody @Valid CreateProjectRequest request, @AuthenticationPrincipal User user){
        return projectService.createProject(request, user.getId());
    }

    @GetMapping("/projects/{id}")
    public ProjectResponse getProject(@PathVariable long id, @AuthenticationPrincipal User user){
        return projectService.getProjectForUser(id, user.getId());
    }

    @PutMapping("/projects/{id}")
    public ProjectResponse updateProject(@PathVariable long id, @RequestBody @Valid UpdateProjectRequest request, @AuthenticationPrincipal User user){
        return projectService.updateProject(id, user.getId(), request);
    }

    @DeleteMapping("/projects/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProject(@PathVariable long id, @AuthenticationPrincipal User user){
        projectService.deleteProject(id, user.getId());
    }

    @PostMapping("/projects/{id}/assign/{workerId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void assignWorker(@PathVariable long id, @PathVariable long workerId, @AuthenticationPrincipal User user){
        projectService.assignWorker(id, workerId, user.getId());
    }

    @PostMapping("/projects/{id}/status")
    public ProjectResponse updateStatus(@PathVariable long id, @RequestBody @Valid UpdateProjectStatusRequest request, @AuthenticationPrincipal User user){
        return projectService.updateProjectStatus(id, request.status(), user.getId());
    }

    @GetMapping("/projects/{id}/workers")
    public List<UserResponse> getProjectWorkers(@PathVariable long id, @AuthenticationPrincipal User user) {
        return projectService.getProjectWorkers(id, user.getId());
    }

    @DeleteMapping("/projects/{id}/workers/{workerId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeWorker(@PathVariable long id, @PathVariable long workerId, @AuthenticationPrincipal User user) {
        projectService.removeWorker(id, workerId, user.getId());
    }
}
