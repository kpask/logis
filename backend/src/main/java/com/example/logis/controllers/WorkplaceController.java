package com.example.logis.controllers;

import com.example.logis.data.User;
import com.example.logis.dtos.CreateWorkplaceRequest;
import com.example.logis.dtos.ProjectResponse;
import com.example.logis.dtos.UserResponse;
import com.example.logis.dtos.WorkplaceResponse;
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
        User creator = (User) authentication.getPrincipal();
        // nereik manager ids sukurti, per daug reikalu tsg creator id paduosiu, location maybe too or not required idk
        return workplaceService.createWorkplace(request, creator);
    }

    @GetMapping("/workplaces")
    public List<WorkplaceResponse> getCompanyWorkplaces(Authentication authentication){
        User user = (User) authentication.getPrincipal();
        return workplaceService.getWorkplacesByUser(user);
    }

    @GetMapping("/workplaces/{id}")
    public WorkplaceResponse getWorkplace(@PathVariable long id, Authentication authentication){
        User user = (User) authentication.getPrincipal();
        return workplaceService.getWorkplaceByWorkplaceIdAndUser(id, user);
    }

    @GetMapping("/workplaces/{id}/projects")
    public List<ProjectResponse> getWorkplaceProjects(@PathVariable long id, Authentication authentication){
        User user = (User) authentication.getPrincipal();
        return projectService.getWorkplaceProjectsByWorkplaceIdAndUser(id, user);
    }

    @DeleteMapping("/workplaces/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteWorkplace(@PathVariable Long id, Authentication authentication){
        User user = (User) authentication.getPrincipal();
        workplaceService.deleteWorkplaceByWorkplaceIdAndUser(id, user);
    }
}