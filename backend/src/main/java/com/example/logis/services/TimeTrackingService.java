package com.example.logis.services;

import com.example.logis.data.ProjectWorker;
import com.example.logis.data.TimeEntry;
import com.example.logis.data.User;
import com.example.logis.dtos.TimeEntryResponse;
import com.example.logis.exceptions.ForbiddenActionException;
import com.example.logis.exceptions.TimeEntryNotFoundException;
import com.example.logis.repository.TimeTrackingRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class TimeTrackingService {
    private final TimeTrackingRepository timeTrackingRepository;
    private final ProjectService projectService;

    public TimeTrackingService(TimeTrackingRepository timeTrackingRepository, ProjectService projectService){
        this.timeTrackingRepository = timeTrackingRepository;
        this.projectService = projectService;
    }

    public TimeEntryResponse startTimeEntry(long projectId, User user) {
        if(timeTrackingRepository.findActiveTimeEntry(user.getId()).isPresent()){
            throw new IllegalArgumentException("A timer is already running — stop it before starting a new one");
        }

        ProjectWorker projectWorker = projectService.findProjectWorker(projectId, user.getId())
                .orElseThrow(() -> new ForbiddenActionException("User " + user.getId() + " is not on project " + projectId));

        TimeEntry savedTimeEntry = timeTrackingRepository.save(new TimeEntry(projectWorker));
        return toResponse(savedTimeEntry);
    }

    public TimeEntryResponse stopTimeEntry(long id, User user) {
        TimeEntry timeEntry = timeTrackingRepository.findById(id)
                .orElseThrow(() -> new TimeEntryNotFoundException(id));

        if(!timeEntry.getProjectWorker().getWorker().getId().equals(user.getId())){
            throw new ForbiddenActionException("Only the worker who started this timer can stop it");
        }
        if(timeEntry.getEndTime() != null){
            throw new IllegalArgumentException("This time entry is already stopped");
        }

        timeEntry.setEndTime(Instant.now());
        TimeEntry savedTimeEntry = timeTrackingRepository.save(timeEntry);
        return toResponse(savedTimeEntry);
    }

    public List<TimeEntryResponse> getUserTimeEntries(long userId, Long projectId, Instant from, Instant to) {
        return timeTrackingRepository.findAllByWorkerId(userId).stream()
                .filter(t -> t.getEndTime() != null)
                .filter(t -> inRange(t, from, to))
                .map(this::toResponse)
                .toList();
    }

    private TimeEntryResponse toResponse(TimeEntry t) {
        return new TimeEntryResponse(
                t.getId(),
                t.getProjectWorker().getId(),
                t.getProjectWorker().getProject().getId(),
                t.getStartTime(),
                t.getEndTime(),
                t.getDuration()
        );
    }

    private boolean inRange(TimeEntry t, Instant from, Instant to) {
        if(from != null && t.getStartTime().isBefore(from)) return false;
        if(to != null && t.getStartTime().isAfter(to)) return false;
        return true;
    }
}