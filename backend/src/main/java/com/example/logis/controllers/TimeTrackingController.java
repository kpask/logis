package com.example.logis.controllers;

import com.example.logis.data.User;
import com.example.logis.dtos.TimeEntryResponse;
import com.example.logis.services.TimeTrackingService;
import org.springframework.format.annotation.DateTimeFormat;
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
    public TimeEntryResponse startTimeEntry(@PathVariable long projectId, Authentication authentication){
        User user = (User) authentication.getPrincipal();
        return timeTrackingService.startTimeEntry(projectId, user);
    }

    @PostMapping("/me/time-entries/{id}/stop")
    public TimeEntryResponse stopTimeEntry(@PathVariable long id, Authentication authentication){
        User user = (User) authentication.getPrincipal();
        return timeTrackingService.stopTimeEntry(id, user);
    }

    @GetMapping("/me/time-entries")
    public List<TimeEntryResponse> getMyTimeEntries(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            Authentication authentication){
        User user = (User) authentication.getPrincipal();
        return timeTrackingService.getUserTimeEntries(user.getId(), null, from, to);
    }
}