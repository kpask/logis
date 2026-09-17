package com.example.logis.services;

import com.example.logis.data.entities.*;
import com.example.logis.data.enums.CompanyRole;
import com.example.logis.data.enums.TimeEntryLogStatus;
import com.example.logis.dtos.requests.CreateTimeEntryRequest;
import com.example.logis.dtos.requests.StartTimeEntryRequest;
import com.example.logis.dtos.responses.TimeEntryResponse;
import com.example.logis.dtos.requests.UpdateTimeEntryRequest;
import com.example.logis.dtos.responses.TimeWorkedResponse;
import com.example.logis.exceptions.ForbiddenActionException;
import com.example.logis.exceptions.TimeEntryNotFoundException;
import com.example.logis.repository.TimeTrackingRepository;
import com.example.logis.util.AuthorizationHelper;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;

@Service
public class TimeTrackingService {
    /** The company timezone used for all calendar-day grouping (matches the frontend). */
    public static final ZoneId WORK_ZONE = ZoneId.of("Europe/Vilnius");

    private final TimeTrackingRepository timeTrackingRepository;
    private final ProjectService projectService;
    private final WorkplaceService workplaceService;
    private final UserService userService;
    private final CompanySettingsService companySettingsService;

    public TimeTrackingService(TimeTrackingRepository timeTrackingRepository, ProjectService projectService, WorkplaceService workplaceService, UserService userService, CompanySettingsService companySettingsService){
        this.timeTrackingRepository = timeTrackingRepository;
        this.projectService = projectService;
        this.workplaceService = workplaceService;
        this.userService = userService;
        this.companySettingsService = companySettingsService;
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

        TimeEntryLogStatus status = inside ? TimeEntryLogStatus.LOGGED : TimeEntryLogStatus.LOGGED_OUTSIDE;
        TimeEntry savedTimeEntry = timeTrackingRepository.save(new TimeEntry(projectWorker, status));
        return toResponse(savedTimeEntry);
    }

    @Transactional
    public TimeEntryResponse stopTimeEntry(long id, Long userId) {
        User user = userService.findUser(userId);
        TimeEntry timeEntry = timeTrackingRepository.findById(id)
                .orElseThrow(() -> new TimeEntryNotFoundException(id));

        if(!timeEntry.getProjectWorker().getWorker().getId().equals(user.getId()) && !AuthorizationHelper.isManagerOrHigherOfCompany(user, timeEntry.getProjectWorker().getProject().getWorkplace().getCompany())){
            throw new ForbiddenActionException("Only the worker who started this timer can stop it");
        }

        if(timeEntry.getEndTime() != null){
            throw new IllegalArgumentException("This time entry is already stopped");
        }

        timeEntry.setEndTime(Instant.now());
        TimeEntry savedTimeEntry = timeTrackingRepository.save(timeEntry);
        if(savedTimeEntry.getEndTime().minusSeconds(60).isBefore(savedTimeEntry.getStartTime())){
            timeTrackingRepository.delete(savedTimeEntry);
        }
        return toResponse(savedTimeEntry);
    }

    @Transactional(readOnly = true)
    public List<TimeEntryResponse> getUserTimeEntries(long userId, long requesterUserId, Instant from, Instant to) {
        User user = userService.findUser(userId);
        User requester = userService.findUser(requesterUserId);
        boolean isSelf = user.getId().equals(requester.getId());

        if (!isSelf && !AuthorizationHelper.isManagerOrHigherOfCompany(requester, user.getCompany())) {
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

    private boolean inRange(TimeEntry t, Instant from, Instant to) {
        if(from != null && t.getStartTime().isBefore(from)) return false;
        return to == null || !t.getStartTime().isAfter(to);
    }

    @Transactional
    public List<TimeEntryResponse> getProjectTimeEntries(long projectId, Long requesterId) {
        User requester = userService.findUser(requesterId);
        Project project = projectService.findProject(projectId);

        boolean isProjectWorker = projectService.findProjectWorker(projectId, requester.getId()).isPresent()
                && projectService.findProjectWorker(projectId, requester.getId()).get().getEndDate() == null;

        if(!isProjectWorker && !AuthorizationHelper.isManagerOrHigherOfCompany(requester, requester.getCompany())) {
            throw new ForbiddenActionException("You are not authorized to view time entries for this project.");
        }

        if(!AuthorizationHelper.isProjectOwnedByCompany(project, requester.getCompany())){
            throw new ForbiddenActionException("This project is not part of your company.");
        }
        if(!requester.getRole().equals(CompanyRole.USER)){
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
        return timeTrackingRepository.findAllByProjectId(projectId).stream()
                .map((this::toResponse)).toList();
    }

    @Transactional
    public List<TimeEntry> findAllByProjectId(long projectId) {
        return timeTrackingRepository.findAllByProjectId(projectId);
    }

    public List<TimeEntry> findAllByUserIdAndProjectId(long userId, long projectId) {
        return timeTrackingRepository.findAllByWorkerIdAndProjectId(userId, projectId);
    }

    public List<TimeEntry> findAllByWorkplaceId(long workplaceId) {
        return timeTrackingRepository.findAllByWorkplaceId(workplaceId);
    }

    public List<TimeEntry> findAllByWorkplaceIdAndUserid(long workplaceId, long userId){
        return timeTrackingRepository.findAllByWorkplaceIdAndWorkerId(workplaceId, userId);
    }

    @Transactional(readOnly = true)
    public List<TimeEntryResponse> getWorkplaceTimeEntries(long workplaceId, Long requesterId) {
        User requester = userService.findUser(requesterId);
        Workplace workplace = workplaceService.findWorkplace(workplaceId);
        if (!AuthorizationHelper.isWorkplaceOwnedByCompany(workplace, requester.getCompany())) {
            throw new ForbiddenActionException("User " + requester.getId() + " is not a member of the company that owns workplace " + workplace.getId());
        }

        if (AuthorizationHelper.isManagerOrHigherOfCompany(requester, workplace.getCompany())) {
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

        if(!AuthorizationHelper.isManagerOrHigherOfCompany(user, projectWorker.getProject().getWorkplace().getCompany())){
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
                request.endTime(),
                TimeEntryLogStatus.MANUAL_ENTRY
        );

        TimeEntry savedTimeEntry = timeTrackingRepository.save(timeEntry);
        return toResponse(savedTimeEntry);
    }

    @Transactional
    public TimeEntryResponse updateTimeEntry(long timeEntryId, UpdateTimeEntryRequest request, Long requesterId){
        User requester = userService.findUser(requesterId);
        TimeEntry timeEntry = findTimeEntry(timeEntryId);

        if(!AuthorizationHelper.isManagerOrHigherOfCompany(requester, timeEntry.getProjectWorker().getProject().getWorkplace().getCompany())){
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

        if(!AuthorizationHelper.isManagerOrHigherOfCompany(requester, timeEntry.getProjectWorker().getProject().getWorkplace().getCompany())){
            throw new ForbiddenActionException("User " + requester.getId() + " is not authorized to delete this time entry.");
        }

        if(timeEntry.getEndTime() == null){
            throw new IllegalArgumentException("Stop the running timer before deleting it");
        }

        timeTrackingRepository.delete(timeEntry);
    }

    public TimeEntry findTimeEntry(long timeEntryId){
        return timeTrackingRepository.findById(timeEntryId)
                .orElseThrow(() -> new TimeEntryNotFoundException(timeEntryId));
    }

    @Transactional(readOnly = true)
    public List<TimeWorkedResponse> getUserTimeWorked(long userId, long requesterId, Instant from, Instant to) {
        User user = userService.findUser(userId);
        User requester = userService.findUser(requesterId);

        if(!user.getId().equals(requester.getId()) && !AuthorizationHelper.isManagerOrHigherOfCompany(requester, user.getCompany())){
            throw new ForbiddenActionException("You are not authorized to view this users work time.");
        }
        if (!AuthorizationHelper.areUsersPartOfSameCompany(user, requester)) {
            throw new ForbiddenActionException("You are not authorized to view this users work time");
        }

        List<TimeEntry> entries = timeTrackingRepository
                .findAllByWorkerId(userId)
                .stream()
                .filter(t -> inRange(t, from, to))
                .toList();

        return calculateTimeWorkedForUsers(entries);
    }

    @Transactional
    public List<TimeWorkedResponse> getWorkplaceTimeWorked(long workplaceId, Long userId) {
        Workplace workplace = workplaceService.findWorkplace(workplaceId);
        User user = userService.findUser(userId);
        List<TimeEntry> timeEntries;

        if(!AuthorizationHelper.isWorkplaceOwnedByCompany(workplace, user.getCompany())){
            throw new ForbiddenActionException("This workplace doesn't belong to your company");
        }

        if(AuthorizationHelper.isManagerOrHigherOfCompany(user, user.getCompany())){
            timeEntries = findAllByWorkplaceId(workplaceId);
        }
        else{
            timeEntries = findAllByWorkplaceIdAndUserid(workplaceId, userId);
        }
        return calculateTimeWorkedForUsers(timeEntries);
    }

    @Transactional(readOnly = true)
    public List<TimeWorkedResponse> getCompanyTimeWorked(long requesterId, Instant from, Instant to) {
        User requester = userService.findUser(requesterId);

        if (!AuthorizationHelper.isManagerOrHigherOfCompany(requester, requester.getCompany())) {
            throw new ForbiddenActionException("Only managers can view company-wide worked time.");
        }

        List<TimeEntry> entries = timeTrackingRepository
                .findAllByCompanyId(requester.getCompany().getId())
                .stream()
                .filter(t -> inRange(t, from, to))
                .toList();

        return calculateTimeWorkedForUsers(entries);
    }

    @Transactional
    public List<TimeWorkedResponse> getProjectTimeWorked(long projectId, Long userId) {
        User user = userService.findUser(userId);
        Project project = projectService.findProject(projectId);
        List<TimeEntry> timeEntries;

        if(!AuthorizationHelper.isUserPartOfCompany(user, project.getWorkplace().getCompany())){
            throw new ForbiddenActionException("This project doesn't belong to your company.");
        }

        if(AuthorizationHelper.isManagerOrHigherOfCompany(user, project.getWorkplace().getCompany())){
            timeEntries = findAllByProjectId(projectId);
        }
        else{
            timeEntries = findAllByUserIdAndProjectId(userId, projectId);
        }

        return calculateTimeWorkedForUsers(timeEntries);
    }

    private List<TimeWorkedResponse> calculateTimeWorkedForUsers(List<TimeEntry> entries) {
        Map<Long, List<TimeEntry>> entriesByUser = new HashMap<>();

        for (TimeEntry entry : entries) {
            Long userId = entry.getProjectWorker().getWorker().getId();
            entriesByUser.computeIfAbsent(userId, id -> new ArrayList<>()).add(entry);
        }

        List<TimeWorkedResponse> result = new ArrayList<>();

        for (var entry : entriesByUser.entrySet()) {
            long userId = entry.getKey();
            long lunchLength = companySettingsService.getSettingsForUser(userId).defaultLunchLength();
            result.addAll(calculateTimeWorkedForUser(entry.getValue(), lunchLength, userId));
        }

        return result;
    }

    private List<TimeWorkedResponse> calculateTimeWorkedForUser(List<TimeEntry> entries, long lunchLength, Long userId) {
        ZoneId zone = WORK_ZONE;
        entries.sort(Comparator.comparing(TimeEntry::getStartTime));

        List<TimeWorkedResponse> result = new ArrayList<>();
        LocalDate currentDate = null;
        Duration tracked = Duration.ZERO;
        Set<String> dayProjects = new LinkedHashSet<>();

        for (TimeEntry entry : entries) {
            LocalDate date = entry.getStartTime().atZone(zone).toLocalDate();

            if (currentDate != null && !date.equals(currentDate)) {
                result.add(createResponse(currentDate, tracked, dayProjects, lunchLength, userId));
                tracked = Duration.ZERO;
                dayProjects = new LinkedHashSet<>();
            }

            currentDate = date;
            tracked = tracked.plus(entry.getDuration());
            String projectName = entry.getProjectWorker().getProject().getProjectName();
            if (projectName != null) {
                dayProjects.add(projectName);
            }
        }

        if (currentDate != null) {
            result.add(createResponse(currentDate, tracked, dayProjects, lunchLength, userId));
        }

        return result;
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

    private TimeWorkedResponse createResponse(LocalDate date, Duration tracked, Set<String> projects, long lunchLength, Long userId) {
        return new TimeWorkedResponse(
                userId,
                date,
                tracked,
                tracked.compareTo(Duration.ofMinutes(lunchLength)) > 0 ? tracked.minusMinutes(lunchLength) : tracked,
                List.copyOf(projects)
        );
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
                t.getStatus()
        );
    }
}
