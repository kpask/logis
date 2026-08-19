package com.example.logis.controllers;

import com.example.logis.data.User;
import com.example.logis.dtos.AssignWorkerRequest;
import com.example.logis.dtos.CreateProjectRequest;
import com.example.logis.dtos.ProjectResponse;
import com.example.logis.services.ProjectService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
public class ProjectController {
    private final ProjectService projectService;

    public ProjectController(ProjectService projectService){
        this.projectService = projectService;
    }

    @PostMapping("/project")
    public ProjectResponse createProject(@RequestBody @Valid CreateProjectRequest request, Authentication authentication){
        User creator = (User) authentication.getPrincipal();
        return projectService.createProject(request, creator);
    }

    @GetMapping("/project/{id}")
    public ProjectResponse getProject(@PathVariable long id){
        return projectService.getProject(id);
    }

    @PostMapping("/project/{id}/assign")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void assignWorker(@PathVariable long id, @RequestBody @Valid AssignWorkerRequest request, Authentication authentication){
        User assigner = (User) authentication.getPrincipal();
        projectService.assignWorker(id, request.workerId(), assigner);
    }
}