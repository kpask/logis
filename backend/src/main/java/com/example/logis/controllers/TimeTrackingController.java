package com.example.logis.controllers;

import com.example.logis.data.entities.User;
import com.example.logis.dtos.requests.CreateTimeEntryRequest;
import com.example.logis.dtos.requests.StartTimeEntryRequest;
import com.example.logis.dtos.responses.TimeEntryResponse;
import com.example.logis.dtos.requests.UpdateTimeEntryRequest;
import com.example.logis.dtos.responses.TimeWorkedResponse;
import com.example.logis.services.TimeExportService;
import com.example.logis.services.TimeExportService.ExportFile;
import com.example.logis.services.TimeTrackingService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
public class TimeTrackingController {
    private final TimeTrackingService timeTrackingService;
    private final TimeExportService timeExportService;

    public TimeTrackingController(TimeTrackingService timeTrackingService, TimeExportService timeExportService){
        this.timeTrackingService = timeTrackingService;
        this.timeExportService = timeExportService;
    }

    @PostMapping("/projects/{projectId}/time-entries/start")
    public TimeEntryResponse startTimeEntry(@PathVariable long projectId, @RequestBody @Valid StartTimeEntryRequest request, @AuthenticationPrincipal User user) {
        return timeTrackingService.startTimeEntry(projectId, user.getId(), request);
    }

    @PostMapping("/me/time-entries/{id}/stop")
    public TimeEntryResponse stopTimeEntry(@PathVariable long id, @AuthenticationPrincipal User user){
        return timeTrackingService.stopTimeEntry(id, user.getId());
    }

    @GetMapping("/projects/{projectId}/time-entries")
    public List<TimeEntryResponse> getTimeEntriesForProject(@PathVariable long projectId, @AuthenticationPrincipal User user){
        return timeTrackingService.getProjectTimeEntries(projectId, user.getId());
    }

    @GetMapping("/workplaces/{workplaceId}/time-entries")
    public List<TimeEntryResponse> getTimeEntriesForWorkplace(@PathVariable long workplaceId, @AuthenticationPrincipal User user){
        return timeTrackingService.getWorkplaceTimeEntries(workplaceId, user.getId());
    }


    @PostMapping("/projects/{projectId}/time-entries")
    public TimeEntryResponse createTimeEntryForProject(@PathVariable long projectId, @RequestBody @Valid CreateTimeEntryRequest request, @AuthenticationPrincipal User user){
        return timeTrackingService.createTimeEntryForProject(projectId, request, user.getId());
    }

    @GetMapping("/time-entries/{userId}")
    public List<TimeEntryResponse> getUserTimeEntries(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @PathVariable int userId, @AuthenticationPrincipal User user
    ){
        return timeTrackingService.getUserTimeEntries(userId, user.getId(), from, to);
    }
    @PutMapping("/time-entries/{id}")
    public TimeEntryResponse editTimeEntry(@PathVariable long id, @RequestBody @Valid UpdateTimeEntryRequest request, @AuthenticationPrincipal User user){
        return timeTrackingService.updateTimeEntry(id, request, user.getId());
    }

    @DeleteMapping("/time-entries/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTimeEntry(@PathVariable long id, @AuthenticationPrincipal User user){
        timeTrackingService.deleteTimeEntry(id, user.getId());
    }

    @GetMapping("/me/time-entries")
    public List<TimeEntryResponse> getMyTimeEntries(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @AuthenticationPrincipal User user){
        return timeTrackingService.getUserTimeEntries(user.getId(), user.getId(), from, to);
    }

    @GetMapping("/me/time-worked")
    public List<TimeWorkedResponse> getMyTimeWorked(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @AuthenticationPrincipal User user) {

        return timeTrackingService.getUserTimeWorked(user.getId(), user.getId(), from, to);
    }

    @GetMapping("/time-worked/{userId}")
    public List<TimeWorkedResponse> getUserTimeWorked(
            @PathVariable long userId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @AuthenticationPrincipal User user) {

        return timeTrackingService.getUserTimeWorked(userId, user.getId(), from, to);
    }

    @GetMapping("/projects/{projectId}/time-worked")
    public List<TimeWorkedResponse> getTimeWorkedForProject(@PathVariable long projectId, @AuthenticationPrincipal User user) {
        return timeTrackingService.getProjectTimeWorked(projectId, user.getId());
    }

    @GetMapping("/workplaces/{workplaceId}/time-worked")
    public List<TimeWorkedResponse> getTimeWorkedForWorkplace(@PathVariable long workplaceId, @AuthenticationPrincipal User user) {
        return timeTrackingService.getWorkplaceTimeWorked(workplaceId, user.getId());
    }

    @GetMapping("/company/time-worked")
    public List<TimeWorkedResponse> getCompanyTimeWorked(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @AuthenticationPrincipal User user) {
        return timeTrackingService.getCompanyTimeWorked(user.getId(), from, to);
    }

    @GetMapping("/me/time-worked/export")
    public ResponseEntity<byte[]> exportMyTimeWorked(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) String format,
            @AuthenticationPrincipal User user) {
        return toFileResponse(timeExportService.exportUserWorked(user.getId(), user.getId(), year, month, format));
    }

    @GetMapping("/time-worked/{userId}/export")
    public ResponseEntity<byte[]> exportUserTimeWorked(
            @PathVariable long userId,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) String format,
            @AuthenticationPrincipal User user) {
        return toFileResponse(timeExportService.exportUserWorked(userId, user.getId(), year, month, format));
    }

    @GetMapping("/company/time-worked/export")
    public ResponseEntity<byte[]> exportCompanyTimeWorked(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) String format,
            @AuthenticationPrincipal User user) {
        return toFileResponse(timeExportService.exportCompanyWorked(user.getId(), year, month, format));
    }

    private ResponseEntity<byte[]> toFileResponse(ExportFile file) {
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.mediaType()))
                .header("Content-Disposition", "attachment; filename=\"" + file.fileName() + "\"")
                .body(file.content());
    }
}