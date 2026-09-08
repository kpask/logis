package com.example.logis.controllers;

import com.example.logis.data.entities.User;
import com.example.logis.dtos.requests.CreateTimeEntryRequest;
import com.example.logis.dtos.requests.StartTimeEntryRequest;
import com.example.logis.dtos.responses.TimeEntryResponse;
import com.example.logis.dtos.requests.UpdateTimeEntryRequest;
import com.example.logis.services.TimeTrackingService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
public class TimeTrackingController {
    private final TimeTrackingService timeTrackingService;

    public TimeTrackingController(TimeTrackingService timeTrackingService){
        this.timeTrackingService = timeTrackingService;
    }

    @PostMapping("/projects/{projectId}/time-entries/start")
    public TimeEntryResponse startTimeEntry(@PathVariable long projectId, @RequestBody @Valid StartTimeEntryRequest request, Authentication authentication) {
        Long userId = ((User) authentication.getPrincipal()).getId();
        return timeTrackingService.startTimeEntry(projectId, userId, request);
    }

    @PostMapping("/me/time-entries/{id}/stop")
    public TimeEntryResponse stopTimeEntry(@PathVariable long id, Authentication authentication){
        Long userId = ((User) authentication.getPrincipal()).getId();
        return timeTrackingService.stopTimeEntry(id, userId);
    }

    @GetMapping("/projects/{projectId}/time-entries")
    public List<TimeEntryResponse> getTimeEntriesForProject(@PathVariable long projectId, Authentication authentication){
        Long userId = ((User) authentication.getPrincipal()).getId();
        return timeTrackingService.getProjectTimeEntries(projectId, userId);
    }

    @GetMapping("/workplaces/{workplaceId}/time-entries")
    public List<TimeEntryResponse> getTimeEntriesForWorkplace(@PathVariable long workplaceId, Authentication authentication){
        Long userId = ((User) authentication.getPrincipal()).getId();
        return timeTrackingService.getWorkplaceTimeEntries(workplaceId, userId);
    }


    @PostMapping("/projects/{projectId}/time-entries")
    public TimeEntryResponse createTimeEntryForProject(@PathVariable long projectId, @RequestBody @Valid CreateTimeEntryRequest request, Authentication authentication){
        Long userId = ((User) authentication.getPrincipal()).getId();
        return timeTrackingService.createTimeEntryForProject(projectId, request, userId);
    }

    @GetMapping("/time-entries/{userId}")
    public List<TimeEntryResponse> getUserTimeEntries(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @PathVariable int userId, Authentication authentication
    ){
        User user = (User) authentication.getPrincipal();
        return timeTrackingService.getUserTimeEntries(userId, user.getId(), from, to);
    }
    @PutMapping("/time-entries/{id}")
    public TimeEntryResponse editTimeEntry(@PathVariable long id, @RequestBody @Valid UpdateTimeEntryRequest request, Authentication authentication){
        Long userId = ((User) authentication.getPrincipal()).getId();
        return timeTrackingService.updateTimeEntry(id, request, userId);
    }

    @DeleteMapping("/time-entries/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTimeEntry(@PathVariable long id, Authentication authentication){
        Long userId = ((User) authentication.getPrincipal()).getId();
        timeTrackingService.deleteTimeEntry(id, userId);
    }

    @GetMapping("/me/time-entries")
    public List<TimeEntryResponse> getMyTimeEntries(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            Authentication authentication){
        User user = (User) authentication.getPrincipal();
        return timeTrackingService.getUserTimeEntries(user.getId(), user.getId(), from, to);
    }
}