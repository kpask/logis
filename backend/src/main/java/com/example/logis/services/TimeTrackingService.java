package com.example.logis.services;

import com.example.logis.data.*;
import com.example.logis.data.enums.CompanyRole;
import com.example.logis.data.enums.TimeEntryLogStatus;
import com.example.logis.dtos.CreateTimeEntryRequest;
import com.example.logis.dtos.StartTimeEntryRequest;
import com.example.logis.dtos.TimeEntryResponse;
import com.example.logis.dtos.UpdateTimeEntryRequest;
import com.example.logis.exceptions.ForbiddenActionException;
import com.example.logis.exceptions.TimeEntryNotFoundException;
import com.example.logis.repository.TimeTrackingRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class TimeTrackingService {
    private final TimeTrackingRepository timeTrackingRepository;
    private final ProjectService projectService;
    private final WorkplaceService workplaceService;
    private final UserService userService;

    public TimeTrackingService(TimeTrackingRepository timeTrackingRepository, ProjectService projectService, WorkplaceService workplaceService, UserService userService){
        this.timeTrackingRepository = timeTrackingRepository;
        this.projectService = projectService;
        this.workplaceService = workplaceService;
        this.userService = userService;
    }

    @Transactional
    public TimeEntryResponse startTimeEntry(long projectId, Long userId, StartTimeEntryRequest request) {
        User user = userService.findUser(userId);
        Workplace workplace = projectService.findProject(projectId).getWorkplace();

        if(timeTrackingRepository.findActiveTimeEntry(user.getId()).isPresent()){
            throw new IllegalArgumentException("A timer is already running — stop it before starting a new one");
        }

        ProjectWorker projectWorker = projectService.findProjectWorker(projectId, user.getId())
                .orElseThrow(() -> new ForbiddenActionException("User " + user.getId() + " is not on project " + projectId));

        if(projectWorker.getEndDate() != null){
            throw new ForbiddenActionException("User " + user.getId() + " is no longer assigned to project " + projectId);
        }

        boolean inside = true;
        if (workplace.getLocation() != null) {
            if (request.latitude() != null && request.longitude() != null) {
                double distance = distanceMeters(
                        workplace.getLocation().getLatitude(),
                        workplace.getLocation().getLongitude(),
                        request.latitude(),
                        request.longitude()
                );

                inside = distance <= workplace.getRadiusMeters();
            } else {
                inside = false;
            }
        }

        TimeEntry savedTimeEntry = timeTrackingRepository.save(new TimeEntry(projectWorker, inside ? TimeEntryLogStatus.LOGGED : TimeEntryLogStatus.LOGGED_OUTSIDE));
        return toResponse(savedTimeEntry);
    }

    @Transactional
    public TimeEntryResponse stopTimeEntry(long id, Long userId) {
        User user = userService.findUser(userId);
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
    public List<TimeEntryResponse> getUserTimeEntries(long userId, long requesterUserId, Instant from, Instant to) {
        User user = userService.findUser(userId);
        User requester = userService.findUser(requesterUserId);
        boolean isSelf = user.getId().equals(requester.getId());
        boolean requesterIsManager = requester.getRole().equals(CompanyRole.MANAGER);
        if (!isSelf && !requesterIsManager) {
            throw new ForbiddenActionException("You are not authorized to view others work time");
        }
        if (requester.getCompany() == null) {
            throw new ForbiddenActionException("You are not part of a company.");
        }
        return getUserTimeEntries(user.getId(), from, to, requester.getCompany().getId());
    }

    @Transactional(readOnly = true)
    public List<TimeEntryResponse> getUserTimeEntries(long userId, Instant from, Instant to, long companyId) {
        return timeTrackingRepository.findAllByWorkerId(userId).stream()
                .filter(t -> inRange(t, from, to))
                .filter(t -> t.getProjectWorker().getProject().getWorkplace().getCompany().getId() == companyId)
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
                t.getDuration().toSeconds(),
                t.getLunchLength() == null ? 0L : t.getLunchLength(),
                t.getStatus()
        );
    }

    private boolean inRange(TimeEntry t, Instant from, Instant to) {
        if(from != null && t.getStartTime().isBefore(from)) return false;
        if(to != null && t.getStartTime().isAfter(to)) return false;
        return true;
    }

    @Transactional
    public List<TimeEntryResponse> getProjectTimeEntries(long projectId, Long requesterId) {
        User requester = userService.findUser(requesterId);
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
    public List<TimeEntryResponse> getWorkplaceTimeEntries(long workplaceId, Long requesterId) {
        User requester = userService.findUser(requesterId);
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
    public TimeEntryResponse createTimeEntryForProject(long projectId, CreateTimeEntryRequest request, Long userId) {
        User user = userService.findUser(userId);
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

        long lunchLength = request.lunchLength() != null ? request.lunchLength() : 30L;
        if (lunchLength < 0) {
            throw new IllegalArgumentException("Lunch length cannot be negative");
        }

        TimeEntry timeEntry = new TimeEntry(
                projectWorker,
                request.startTime(),
                request.endTime(),
                TimeEntryLogStatus.MANUAL_ENTRY
        );
        timeEntry.setLunchLength(lunchLength);

        TimeEntry savedTimeEntry = timeTrackingRepository.save(timeEntry);
        return toResponse(savedTimeEntry);
    }

    @Transactional
    public TimeEntryResponse updateTimeEntry(long timeEntryId, UpdateTimeEntryRequest request, Long requesterId){
        User requester = userService.findUser(requesterId);
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

        long lunchLength = request.lunchLength() != null ? request.lunchLength() : timeEntry.getLunchLength() != null ? timeEntry.getLunchLength() : 30L;
        if (lunchLength < 0) {
            throw new IllegalArgumentException("Lunch length cannot be negative");
        }

        timeEntry.setStartTime(request.startTime());
        timeEntry.setEndTime(request.endTime());
        timeEntry.setLunchLength(lunchLength);
        if(!timeEntry.getStatus().equals(TimeEntryLogStatus.MANUAL_ENTRY)){
            timeEntry.setStatus(TimeEntryLogStatus.EDITED);
        }
        return toResponse(timeTrackingRepository.save(timeEntry));
    }

    @Transactional
    public void deleteTimeEntry(long timeEntryId, Long requesterId){
        User requester = userService.findUser(requesterId);
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

    public static double distanceMeters(double lat1, double lon1, double lat2, double lon2) {
        double earthRadius = 6371000; // meters
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.pow(Math.sin(dLat / 2), 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.pow(Math.sin(dLon / 2), 2);
        return 2 * earthRadius * Math.asin(Math.sqrt(a));
    }
}
