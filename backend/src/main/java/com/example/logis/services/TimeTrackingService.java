package com.example.logis.services;

import com.example.logis.data.*;
import com.example.logis.dtos.CreateTimeEntryRequest;
import com.example.logis.dtos.TimeEntryResponse;
import com.example.logis.dtos.UpdateTimeEntryRequest;
import com.example.logis.exceptions.ForbiddenActionException;
import com.example.logis.exceptions.TimeEntryNotFoundException;
import com.example.logis.repository.TimeTrackingRepository;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class TimeTrackingService {
    private final TimeTrackingRepository timeTrackingRepository;
    private final ProjectService projectService;
    private final WorkplaceService workplaceService;

    public TimeTrackingService(TimeTrackingRepository timeTrackingRepository, ProjectService projectService, WorkplaceService workplaceService){
        this.timeTrackingRepository = timeTrackingRepository;
        this.projectService = projectService;
        this.workplaceService = workplaceService;
    }

    @Transactional
    public TimeEntryResponse startTimeEntry(long projectId, User user) {
        if(timeTrackingRepository.findActiveTimeEntry(user.getId()).isPresent()){
            throw new IllegalArgumentException("A timer is already running — stop it before starting a new one");
        }

        ProjectWorker projectWorker = projectService.findProjectWorker(projectId, user.getId())
                .orElseThrow(() -> new ForbiddenActionException("User " + user.getId() + " is not on project " + projectId));

        if(projectWorker.getEndDate() != null){
            throw new ForbiddenActionException("User " + user.getId() + " is no longer assigned to project " + projectId);
        }

        TimeEntry savedTimeEntry = timeTrackingRepository.save(new TimeEntry(projectWorker));
        return toResponse(savedTimeEntry);
    }

    @Transactional
    public TimeEntryResponse stopTimeEntry(long id, User user) {
        TimeEntry timeEntry = timeTrackingRepository.findById(id)
                .orElseThrow(() -> new TimeEntryNotFoundException(id));

        boolean requesterIsManager = user.getRole().equals(CompanyRole.MANAGER) && timeEntry.getProjectWorker().getProject().getWorkplace().getCompany().getId().equals(user.getCompany().getId());
        if(!timeEntry.getProjectWorker().getWorker().getId().equals(user.getId()) && !requesterIsManager){
            throw new ForbiddenActionException("Only the worker who started this timer can stop it");
        }

        if(timeEntry.getEndTime() != null){
            throw new IllegalArgumentException("This time entry is already stopped");
        }

        timeEntry.setEndTime(Instant.now());
        TimeEntry savedTimeEntry = timeTrackingRepository.save(timeEntry);
        return toResponse(savedTimeEntry);
    }

    @Transactional(readOnly = true)
    public List<TimeEntryResponse> getUserTimeEntries(long userId, Instant from, Instant to) {
        return timeTrackingRepository.findAllByWorkerId(userId).stream()
                .filter(t -> inRange(t, from, to))
                .map(this::toResponse)
                .toList();
    }

    private TimeEntryResponse toResponse(TimeEntry t) {
        return new TimeEntryResponse(
                t.getId(),
                t.getProjectWorker().getId(),
                t.getProjectWorker().getWorker().getId(),
                t.getProjectWorker().getProject().getId(),
                t.getStartTime(),
                t.getEndTime(),
                t.getDuration().toSeconds()
        );
    }

    private boolean inRange(TimeEntry t, Instant from, Instant to) {
        if(from != null && t.getStartTime().isBefore(from)) return false;
        if(to != null && t.getStartTime().isAfter(to)) return false;
        return true;
    }

    @Transactional
    public List<TimeEntryResponse> getProjectTimeEntries(long projectId, User requester) {
        Project project = projectService.findProject(projectId);

        boolean isProjectWorker = projectService.findProjectWorker(projectId, requester.getId()).isPresent()
                && projectService.findProjectWorker(projectId, requester.getId()).get().getEndDate() == null;

        if(!isProjectWorker && requester.getRole().equals(CompanyRole.USER)){
            throw new ForbiddenActionException("You are not authorized to view time entries for this project.");
        }

        if(!project.getWorkplace().getCompany().getUsers().contains(requester)){
            throw new ForbiddenActionException("This project is not part of your company.");
        }
        if(requester.getRole().equals(CompanyRole.MANAGER)){
            return getAllByProjectId(projectId);
        } else{
            return getAllByUserIdAndProjectId(requester.getId(), projectId);
        }
    }

    public  List<TimeEntryResponse> getAllByUserIdAndProjectId(long userId, long projectId) {
        return timeTrackingRepository.findAllByWorkerIdAndProjectId(userId, projectId).stream()
                .map(this::toResponse).toList();
    }

    @Transactional
    public List<TimeEntryResponse> getAllByProjectId(long projectId) {
        Project project = projectService.findProject(projectId);
        return timeTrackingRepository.findAllByProjectId(projectId).stream()
                .map((this::toResponse)).toList();
    }

    @Transactional(readOnly = true)
    public List<TimeEntryResponse> getWorkplaceTimeEntries(long workplaceId, User requester) {
        Workplace workplace = workplaceService.findWorkplace(workplaceId);
        if (!workplace.getCompany().getUsers().contains(requester)) {
            throw new ForbiddenActionException("You are not a member of this company.");
        }

        if (requester.getRole().equals(CompanyRole.MANAGER) && workplace.getCompany().getManagers().contains(requester)) {
            return timeTrackingRepository.findAllByWorkplaceId(workplaceId)
                    .stream().map(this::toResponse).toList();
        }

        return timeTrackingRepository.findAllByWorkplaceIdAndWorkerId(workplaceId, requester.getId())
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public TimeEntryResponse createTimeEntryForProject(long projectId, CreateTimeEntryRequest request, User user) {
        ProjectWorker projectWorker = projectService.findProjectWorker(projectId, request.workerId())
                .orElseThrow(() -> new ForbiddenActionException("User " + request.workerId() + " is not on project " + projectId));

        boolean requesterIsManager = user.getRole().equals(CompanyRole.MANAGER) && projectWorker.getProject().getWorkplace().getCompany().getManagers().contains(user);

        if(!requesterIsManager){
            throw new ForbiddenActionException("User " + user.getId() + " is not authorized to create time entries for this project.");
        }
        if(projectWorker.getEndDate() != null){
            throw new ForbiddenActionException("User " + request.workerId() + " is no longer assigned to project " + projectId);
        }
        if(request.endTime() != null && !request.endTime().isAfter(request.startTime())){
            throw new IllegalArgumentException("End time must be after start time");
        }

        TimeEntry timeEntry = new TimeEntry(
                projectWorker,
                request.startTime(),
                request.endTime()
        );

        TimeEntry savedTimeEntry = timeTrackingRepository.save(timeEntry);
        return toResponse(savedTimeEntry);
    }

    @Transactional
    public TimeEntryResponse updateTimeEntry(long timeEntryId, UpdateTimeEntryRequest request, User requester){
        TimeEntry timeEntry = timeTrackingRepository.findById(timeEntryId)
                .orElseThrow(() -> new TimeEntryNotFoundException(timeEntryId));

        boolean requesterIsManager = requester.getRole().equals(CompanyRole.MANAGER) && timeEntry.getProjectWorker().getProject().getWorkplace().getCompany().getManagers().contains(requester);
        if(!requesterIsManager){
            throw new ForbiddenActionException("User " + requester.getId() + " is not authorized to update this time entry.");
        }

        if(timeEntry.getEndTime() == null){
            throw new IllegalArgumentException("Stop the running timer before editing it");
        }
        if(!request.endTime().isAfter(request.startTime())){
            throw new IllegalArgumentException("End time must be after start time");
        }

        timeEntry.setStartTime(request.startTime());
        timeEntry.setEndTime(request.endTime());
        return toResponse(timeTrackingRepository.save(timeEntry));
    }

    @Transactional
    public void deleteTimeEntry(long timeEntryId, User requester){
        TimeEntry timeEntry = timeTrackingRepository.findById(timeEntryId)
                .orElseThrow(() -> new TimeEntryNotFoundException(timeEntryId));

        boolean requesterIsManager = requester.getRole().equals(CompanyRole.MANAGER) && timeEntry.getProjectWorker().getProject().getWorkplace().getCompany().getManagers().contains(requester);
        if(!requesterIsManager){
            throw new ForbiddenActionException("User " + requester.getId() + " is not authorized to delete this time entry.");
        }

        if(timeEntry.getEndTime() == null){
            throw new IllegalArgumentException("Stop the running timer before deleting it");
        }

        timeTrackingRepository.delete(timeEntry);
    }
}
