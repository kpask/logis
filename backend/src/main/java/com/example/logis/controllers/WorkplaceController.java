package com.example.logis.controllers;

import com.example.logis.data.User;
import com.example.logis.dtos.CreateWorkplaceRequest;
import com.example.logis.dtos.ProjectResponse;
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

    @GetMapping("/companies/{id}/workplaces")
    public List<WorkplaceResponse> getCompanyWorkplaces(@PathVariable long id){
        return workplaceService.getWorkplaces(id);
    }

    @GetMapping("/workplaces/{id}")
    public WorkplaceResponse getWorkplace(@PathVariable long id){
        return workplaceService.getWorkplace(id);
    }

    @GetMapping("/workplaces/{id}/projects")
    public List<ProjectResponse> getWorkplaceProjects(@PathVariable long id){
        return projectService.getWorkplaceProjects(id);
    }

    @DeleteMapping("/workplaces/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteWorkplace(@PathVariable long id){
        workplaceService.deleteWorkplace(id);
    }
}