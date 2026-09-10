package com.example.logis.services;

import com.example.logis.data.entities.*;
import com.example.logis.data.enums.CompanyRole;
import com.example.logis.data.enums.TimeEntryLogStatus;
import com.example.logis.dtos.requests.CreateTimeEntryRequest;
import com.example.logis.dtos.requests.StartTimeEntryRequest;
import com.example.logis.dtos.responses.TimeEntryResponse;
import com.example.logis.dtos.requests.UpdateTimeEntryRequest;
import com.example.logis.exceptions.ForbiddenActionException;
import com.example.logis.repository.TimeTrackingRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TimeTrackingServiceTest {

    private static final Instant START = Instant.parse("2026-01-01T08:00:00Z");
    private static final Instant END = Instant.parse("2026-01-01T10:00:00Z");

    @Mock
    private TimeTrackingRepository timeTrackingRepository;

    @Mock
    private ProjectService projectService;

    @Mock
    private WorkplaceService workplaceService;

    @Mock
    private UserService userService;

    @Mock
    private CompanySettingsService companySettingsService;

    @InjectMocks
    private TimeTrackingService timeTrackingService;

    // Entity ids are @GeneratedValue; tests assign them via reflection where no setter exists.
    // Managers/members are added to company.getUsers() because several authorization checks
    // rely on company.getManagers()/getUsers().contains(...) and getManagers() derives from users by role.
    private static User user(Long id, CompanyRole role, Company company) {
        User user = new User("John", "Doe", "johndoe", "john" + id + "@acme.com", "password-hash", role);
        user.setCompany(company);
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }

    private static User manager(Long id, Company company) {
        User manager = user(id, CompanyRole.MANAGER, company);
        company.getUsers().add(manager);
        return manager;
    }

    private static User member(Long id, Company company) {
        User member = user(id, CompanyRole.USER, company);
        company.getUsers().add(member);
        return member;
    }

    private static Company company(Long id) {
        Company company = new Company("Acme Ltd");
        ReflectionTestUtils.setField(company, "id", id);
        return company;
    }

    private static Workplace workplace(Long id, Company company) {
        Workplace workplace = new Workplace("Site A", new Location(54.68, 25.28, "Vilnius", "Gedimino", "Gedimino pr. 1"), company);
        ReflectionTestUtils.setField(workplace, "id", id);
        return workplace;
    }

    private static Project project(Long id, Workplace workplace) {
        Project project = new Project("Bridge", workplace, LocalDate.now().plusDays(1));
        project.setId(id);
        return project;
    }

    private static ProjectWorker projectWorker(Long id, User worker, Project project, LocalDate endDate) {
        ProjectWorker projectWorker = new ProjectWorker(worker, project);
        ReflectionTestUtils.setField(projectWorker, "id", id);
        projectWorker.setEndDate(endDate);
        return projectWorker;
    }

    private static TimeEntry timeEntry(Long id, ProjectWorker projectWorker, Instant start, Instant end) {
        TimeEntry timeEntry = new TimeEntry(projectWorker, start, end, TimeEntryLogStatus.LOGGED);
        ReflectionTestUtils.setField(timeEntry, "id", id);
        return timeEntry;
    }

    // ── startTimeEntry ──────────────────────────────────────────────────

    @Test
    void startTimeEntry_startsTimer_whenWorkerIsAssignedToProject() {
        Company company = company(10L);
        User worker = member(2L, company);
        Workplace workplace = workplace(20L, company);
        ProjectWorker assignment = projectWorker(40L, worker, project(30L, workplace), null);
        TimeEntry saved = timeEntry(50L, assignment, Instant.now(), null);
        when(userService.findUser(2L)).thenReturn(worker);
        when(projectService.findProject(30L)).thenReturn(project(30L, workplace));
        when(timeTrackingRepository.findActiveTimeEntry(2L)).thenReturn(Optional.empty());
        when(projectService.findProjectWorker(30L, 2L)).thenReturn(Optional.of(assignment));
        when(timeTrackingRepository.save(any(TimeEntry.class))).thenReturn(saved);

        // workplace center coords → inside the fence → LOGGED
        TimeEntryResponse response = timeTrackingService.startTimeEntry(
                30L, 2L, new StartTimeEntryRequest(54.68, 25.28));

        assertThat(response.id()).isEqualTo(50L);
        assertThat(response.workerId()).isEqualTo(2L);
        assertThat(response.projectId()).isEqualTo(30L);
        assertThat(response.status()).isEqualTo(TimeEntryLogStatus.LOGGED);
    }

    @Test
    void startTimeEntry_flagsLoggedOutside_whenCoordsAreFarFromWorkplace() {
        Company company = company(10L);
        User worker = member(2L, company);
        Workplace workplace = workplace(20L, company); // default radius 150 m
        ProjectWorker assignment = projectWorker(40L, worker, project(30L, workplace), null);
        when(userService.findUser(2L)).thenReturn(worker);
        when(projectService.findProject(30L)).thenReturn(project(30L, workplace));
        when(timeTrackingRepository.findActiveTimeEntry(2L)).thenReturn(Optional.empty());
        when(projectService.findProjectWorker(30L, 2L)).thenReturn(Optional.of(assignment));
        when(timeTrackingRepository.save(any(TimeEntry.class))).thenAnswer(inv -> inv.getArgument(0));

        // ~1.1 km north of the workplace center → outside a 150 m fence
        TimeEntryResponse response = timeTrackingService.startTimeEntry(
                30L, 2L, new StartTimeEntryRequest(54.69, 25.28));

        assertThat(response.status()).isEqualTo(TimeEntryLogStatus.LOGGED_OUTSIDE);
    }

    @Test
    void startTimeEntry_flagsLoggedOutside_whenBrowserCoordsAreMissing() {
        Company company = company(10L);
        User worker = member(2L, company);
        Workplace workplace = workplace(20L, company);
        ProjectWorker assignment = projectWorker(40L, worker, project(30L, workplace), null);
        when(userService.findUser(2L)).thenReturn(worker);
        when(projectService.findProject(30L)).thenReturn(project(30L, workplace));
        when(timeTrackingRepository.findActiveTimeEntry(2L)).thenReturn(Optional.empty());
        when(projectService.findProjectWorker(30L, 2L)).thenReturn(Optional.of(assignment));
        when(timeTrackingRepository.save(any(TimeEntry.class))).thenAnswer(inv -> inv.getArgument(0));

        TimeEntryResponse response = timeTrackingService.startTimeEntry(30L, 2L, new StartTimeEntryRequest(null, null));

        assertThat(response.status()).isEqualTo(TimeEntryLogStatus.LOGGED_OUTSIDE);
    }

    @Test
    void startTimeEntry_throwsIllegalArgument_whenTimerAlreadyRunning() {
        Company company = company(10L);
        User worker = member(2L, company);
        ProjectWorker assignment = projectWorker(40L, worker, project(30L, workplace(20L, company)), null);
        when(userService.findUser(2L)).thenReturn(worker);
        when(projectService.findProject(30L)).thenReturn(project(30L, workplace(20L, company)));
        when(timeTrackingRepository.findActiveTimeEntry(2L)).thenReturn(Optional.of(timeEntry(50L, assignment, Instant.now(), null)));

        assertThatThrownBy(() -> timeTrackingService.startTimeEntry(30L, 2L, new StartTimeEntryRequest(null, null)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already running");

        verify(projectService, never()).findProjectWorker(any(), any());
    }

    @Test
    void startTimeEntry_throwsForbidden_whenWorkerIsNotOnProject() {
        User worker = member(2L, company(10L));
        when(userService.findUser(2L)).thenReturn(worker);
        when(projectService.findProject(30L)).thenReturn(project(30L, workplace(20L, company(10L))));
        when(timeTrackingRepository.findActiveTimeEntry(2L)).thenReturn(Optional.empty());
        when(projectService.findProjectWorker(30L, 2L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> timeTrackingService.startTimeEntry(30L, 2L, new StartTimeEntryRequest(null, null)))
                .isInstanceOf(ForbiddenActionException.class)
                .hasMessageContaining("not on project");
    }

    @Test
    void startTimeEntry_throwsForbidden_whenAssignmentHasEnded() {
        Company company = company(10L);
        User worker = member(2L, company);
        ProjectWorker endedAssignment = projectWorker(40L, worker, project(30L, workplace(20L, company)), LocalDate.now().minusDays(1));
        when(userService.findUser(2L)).thenReturn(worker);
        when(projectService.findProject(30L)).thenReturn(project(30L, workplace(20L, company)));
        when(timeTrackingRepository.findActiveTimeEntry(2L)).thenReturn(Optional.empty());
        when(projectService.findProjectWorker(30L, 2L)).thenReturn(Optional.of(endedAssignment));

        assertThatThrownBy(() -> timeTrackingService.startTimeEntry(30L, 2L, new StartTimeEntryRequest(null, null)))
                .isInstanceOf(ForbiddenActionException.class)
                .hasMessageContaining("no longer assigned");
    }

    // ── stopTimeEntry ───────────────────────────────────────────────────

    @Test
    void stopTimeEntry_stopsTimer_whenOwnerStopsIt() {
        Company company = company(10L);
        User worker = member(2L, company);
        ProjectWorker assignment = projectWorker(40L, worker, project(30L, workplace(20L, company)), null);
        TimeEntry entry = timeEntry(50L, assignment, Instant.now(), null);
        when(userService.findUser(2L)).thenReturn(worker);
        when(timeTrackingRepository.findById(50L)).thenReturn(Optional.of(entry));
        when(timeTrackingRepository.save(entry)).thenReturn(entry);

        timeTrackingService.stopTimeEntry(50L, 2L);

        assertThat(entry.getEndTime()).isNotNull();
        verify(timeTrackingRepository).save(entry);
    }

    @Test
    void stopTimeEntry_throwsForbidden_whenNonOwnerWithoutManagerRoleTriesToStop() {
        Company company = company(10L);
        User owner = member(2L, company);
        User colleague = member(3L, company);
        ProjectWorker assignment = projectWorker(40L, owner, project(30L, workplace(20L, company)), null);
        TimeEntry entry = timeEntry(50L, assignment, Instant.now(), null);
        when(userService.findUser(3L)).thenReturn(colleague);
        when(timeTrackingRepository.findById(50L)).thenReturn(Optional.of(entry));

        assertThatThrownBy(() -> timeTrackingService.stopTimeEntry(50L, 3L))
                .isInstanceOf(ForbiddenActionException.class)
                .hasMessageContaining("Only the worker");

        assertThat(entry.getEndTime()).isNull();
    }

    @Test
    void stopTimeEntry_allowsManagerOfSameCompanyToStopOthersTimer() {
        Company company = company(10L);
        User manager = manager(1L, company);
        User worker = member(2L, company);
        ProjectWorker assignment = projectWorker(40L, worker, project(30L, workplace(20L, company)), null);
        TimeEntry entry = timeEntry(50L, assignment, Instant.now(), null);
        when(userService.findUser(1L)).thenReturn(manager);
        when(timeTrackingRepository.findById(50L)).thenReturn(Optional.of(entry));
        when(timeTrackingRepository.save(entry)).thenReturn(entry);

        timeTrackingService.stopTimeEntry(50L, 1L);

        assertThat(entry.getEndTime()).isNotNull();
        verify(timeTrackingRepository).save(entry);
    }

    @Test
    void stopTimeEntry_throwsIllegalArgument_whenTimerIsAlreadyStopped() {
        Company company = company(10L);
        User worker = member(2L, company);
        ProjectWorker assignment = projectWorker(40L, worker, project(30L, workplace(20L, company)), null);
        TimeEntry entry = timeEntry(50L, assignment, START, END);
        when(userService.findUser(2L)).thenReturn(worker);
        when(timeTrackingRepository.findById(50L)).thenReturn(Optional.of(entry));

        assertThatThrownBy(() -> timeTrackingService.stopTimeEntry(50L, 2L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already stopped");
    }

    // ── getUserTimeEntries ──────────────────────────────────────────────

    @Test
    void getUserTimeEntries_throwsForbidden_whenRequesterIsNotSelfAndNotManager() {
        Company company = company(10L);
        when(userService.findUser(2L)).thenReturn(member(2L, company));
        when(userService.findUser(3L)).thenReturn(member(3L, company));

        assertThatThrownBy(() -> timeTrackingService.getUserTimeEntries(2L, 3L, null, null))
                .isInstanceOf(ForbiddenActionException.class)
                .hasMessageContaining("not authorized");
    }

    @Test
    void getUserTimeEntries_throwsForbidden_whenRequesterHasNoCompany() {
        User user = user(2L, CompanyRole.USER, null);
        when(userService.findUser(2L)).thenReturn(user);

        assertThatThrownBy(() -> timeTrackingService.getUserTimeEntries(2L, 2L, null, null))
                .isInstanceOf(ForbiddenActionException.class)
                .hasMessageContaining("not part of a company");
    }

    @Test
    void getUserTimeEntries_managerCanViewOthers_andResultsAreFilteredByRangeAndCompany() {
        Company company = company(10L);
        Company otherCompany = company(99L);
        User target = member(2L, company);
        User manager = manager(1L, company);
        ProjectWorker ownAssignment = projectWorker(40L, target, project(30L, workplace(20L, company)), null);
        ProjectWorker foreignAssignment = projectWorker(41L, target, project(31L, workplace(21L, otherCompany)), null);
        TimeEntry inRange = timeEntry(50L, ownAssignment, Instant.now().minusSeconds(3600), Instant.now());
        TimeEntry tooOld = timeEntry(51L, ownAssignment, Instant.now().minusSeconds(36000), Instant.now().minusSeconds(35000));
        TimeEntry otherCompanyEntry = timeEntry(52L, foreignAssignment, Instant.now().minusSeconds(1800), Instant.now());
        when(userService.findUser(2L)).thenReturn(target);
        when(userService.findUser(1L)).thenReturn(manager);
        when(timeTrackingRepository.findAllByWorkerId(2L)).thenReturn(List.of(inRange, tooOld, otherCompanyEntry));

        List<TimeEntryResponse> entries = timeTrackingService.getUserTimeEntries(
                2L, 1L, Instant.now().minusSeconds(7200), Instant.now());

        assertThat(entries).hasSize(1);
        assertThat(entries.get(0).id()).isEqualTo(50L);
    }

    // ── getProjectTimeEntries ───────────────────────────────────────────

    @Test
    void getProjectTimeEntries_throwsForbidden_whenPlainUserIsNotProjectWorker() {
        Company company = company(10L);
        User requester = member(3L, company);
        when(userService.findUser(3L)).thenReturn(requester);
        when(projectService.findProject(30L)).thenReturn(project(30L, workplace(20L, company)));
        when(projectService.findProjectWorker(30L, 3L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> timeTrackingService.getProjectTimeEntries(30L, 3L))
                .isInstanceOf(ForbiddenActionException.class)
                .hasMessageContaining("not authorized");
    }

    @Test
    void getProjectTimeEntries_returnsAllEntries_forManager() {
        Company company = company(10L);
        User manager = manager(1L, company);
        Project project = project(30L, workplace(20L, company));
        ProjectWorker assignment = projectWorker(40L, member(2L, company), project, null);
        TimeEntry entry = timeEntry(50L, assignment, START, END);
        when(userService.findUser(1L)).thenReturn(manager);
        when(projectService.findProject(30L)).thenReturn(project);
        when(projectService.findProjectWorker(30L, 1L)).thenReturn(Optional.empty());
        when(timeTrackingRepository.findAllByProjectId(30L)).thenReturn(List.of(entry));

        List<TimeEntryResponse> entries = timeTrackingService.getProjectTimeEntries(30L, 1L);

        assertThat(entries).hasSize(1);
        assertThat(entries.get(0).id()).isEqualTo(50L);
    }

    @Test
    void getProjectTimeEntries_returnsOwnEntries_forProjectWorker() {
        Company company = company(10L);
        User worker = member(2L, company);
        Project project = project(30L, workplace(20L, company));
        ProjectWorker assignment = projectWorker(40L, worker, project, null);
        TimeEntry entry = timeEntry(50L, assignment, START, END);
        when(userService.findUser(2L)).thenReturn(worker);
        when(projectService.findProject(30L)).thenReturn(project);
        when(projectService.findProjectWorker(30L, 2L)).thenReturn(Optional.of(assignment));
        when(timeTrackingRepository.findAllByWorkerIdAndProjectId(2L, 30L)).thenReturn(List.of(entry));

        List<TimeEntryResponse> entries = timeTrackingService.getProjectTimeEntries(30L, 2L);

        assertThat(entries).hasSize(1);
        assertThat(entries.get(0).id()).isEqualTo(50L);
    }

    // ── getWorkplaceTimeEntries ─────────────────────────────────────────

    @Test
    void getWorkplaceTimeEntries_throwsForbidden_whenRequesterIsNotCompanyMember() {
        User requester = member(3L, company(10L));
        when(userService.findUser(3L)).thenReturn(requester);
        when(workplaceService.findWorkplace(20L)).thenReturn(workplace(20L, company(99L)));

        assertThatThrownBy(() -> timeTrackingService.getWorkplaceTimeEntries(20L, 3L))
                .isInstanceOf(ForbiddenActionException.class)
                .hasMessageContaining("not a member");
    }

    @Test
    void getWorkplaceTimeEntries_returnsAllEntries_forManager() {
        Company company = company(10L);
        User manager = manager(1L, company);
        Workplace workplace = workplace(20L, company);
        ProjectWorker assignment = projectWorker(40L, member(2L, company), project(30L, workplace), null);
        TimeEntry entry = timeEntry(50L, assignment, START, END);
        when(userService.findUser(1L)).thenReturn(manager);
        when(workplaceService.findWorkplace(20L)).thenReturn(workplace);
        when(timeTrackingRepository.findAllByWorkplaceId(20L)).thenReturn(List.of(entry));

        List<TimeEntryResponse> entries = timeTrackingService.getWorkplaceTimeEntries(20L, 1L);

        assertThat(entries).hasSize(1);
        assertThat(entries.get(0).id()).isEqualTo(50L);
    }

    @Test
    void getWorkplaceTimeEntries_returnsOwnEntries_forRegularUser() {
        Company company = company(10L);
        User worker = member(2L, company);
        Workplace workplace = workplace(20L, company);
        ProjectWorker assignment = projectWorker(40L, worker, project(30L, workplace), null);
        TimeEntry entry = timeEntry(50L, assignment, START, END);
        when(userService.findUser(2L)).thenReturn(worker);
        when(workplaceService.findWorkplace(20L)).thenReturn(workplace);
        when(timeTrackingRepository.findAllByWorkplaceIdAndWorkerId(20L, 2L)).thenReturn(List.of(entry));

        List<TimeEntryResponse> entries = timeTrackingService.getWorkplaceTimeEntries(20L, 2L);

        assertThat(entries).hasSize(1);
        assertThat(entries.get(0).id()).isEqualTo(50L);
    }

    // ── createTimeEntryForProject ───────────────────────────────────────

    @Test
    void createTimeEntryForProject_createsEntry_whenManagerCreatesForWorker() {
        Company company = company(10L);
        User manager = manager(1L, company);
        User worker = member(2L, company);
        ProjectWorker assignment = projectWorker(40L, worker, project(30L, workplace(20L, company)), null);
        TimeEntry saved = timeEntry(50L, assignment, START, END);
        when(userService.findUser(1L)).thenReturn(manager);
        when(projectService.findProjectWorker(30L, 2L)).thenReturn(Optional.of(assignment));
        when(timeTrackingRepository.save(any(TimeEntry.class))).thenReturn(saved);

        TimeEntryResponse response = timeTrackingService.createTimeEntryForProject(
                30L, new CreateTimeEntryRequest(2L, START, END), 1L);

        ArgumentCaptor<TimeEntry> captor = ArgumentCaptor.forClass(TimeEntry.class);
        verify(timeTrackingRepository).save(captor.capture());
        assertThat(captor.getValue().getStartTime()).isEqualTo(START);
        assertThat(captor.getValue().getEndTime()).isEqualTo(END);
        assertThat(response.id()).isEqualTo(50L);
    }

    @Test
    void createTimeEntryForProject_throwsForbidden_whenRequesterIsNotManager() {
        Company company = company(10L);
        User requester = member(3L, company);
        User worker = member(2L, company);
        ProjectWorker assignment = projectWorker(40L, worker, project(30L, workplace(20L, company)), null);
        when(userService.findUser(3L)).thenReturn(requester);
        when(projectService.findProjectWorker(30L, 2L)).thenReturn(Optional.of(assignment));

        assertThatThrownBy(() -> timeTrackingService.createTimeEntryForProject(
                30L, new CreateTimeEntryRequest(2L, START, END), 3L))
                .isInstanceOf(ForbiddenActionException.class)
                .hasMessageContaining("not authorized to create");

        verify(timeTrackingRepository, never()).save(any());
    }

    @Test
    void createTimeEntryForProject_throwsIllegalArgument_whenEndIsNotAfterStart() {
        Company company = company(10L);
        User manager = manager(1L, company);
        User worker = member(2L, company);
        ProjectWorker assignment = projectWorker(40L, worker, project(30L, workplace(20L, company)), null);
        when(userService.findUser(1L)).thenReturn(manager);
        when(projectService.findProjectWorker(30L, 2L)).thenReturn(Optional.of(assignment));

        assertThatThrownBy(() -> timeTrackingService.createTimeEntryForProject(
                30L, new CreateTimeEntryRequest(2L, START, START), 1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("End time must be after start time");
    }

    // ── updateTimeEntry ─────────────────────────────────────────────────

    @Test
    void updateTimeEntry_updatesFields_whenManagerUpdatesStoppedEntry() {
        Company company = company(10L);
        User manager = manager(1L, company);
        User worker = member(2L, company);
        ProjectWorker assignment = projectWorker(40L, worker, project(30L, workplace(20L, company)), null);
        TimeEntry entry = timeEntry(50L, assignment, START, END);
        when(userService.findUser(1L)).thenReturn(manager);
        when(timeTrackingRepository.findById(50L)).thenReturn(Optional.of(entry));
        when(timeTrackingRepository.save(entry)).thenReturn(entry);

        timeTrackingService.updateTimeEntry(50L,
                new UpdateTimeEntryRequest(START.plusSeconds(3600), END.plusSeconds(3600)), 1L);

        assertThat(entry.getStartTime()).isEqualTo(START.plusSeconds(3600));
        assertThat(entry.getEndTime()).isEqualTo(END.plusSeconds(3600));
    }

    @Test
    void updateTimeEntry_throwsForbidden_whenRequesterIsNotManager() {
        Company company = company(10L);
        User requester = member(3L, company);
        User worker = member(2L, company);
        ProjectWorker assignment = projectWorker(40L, worker, project(30L, workplace(20L, company)), null);
        TimeEntry entry = timeEntry(50L, assignment, START, END);
        when(userService.findUser(3L)).thenReturn(requester);
        when(timeTrackingRepository.findById(50L)).thenReturn(Optional.of(entry));

        assertThatThrownBy(() -> timeTrackingService.updateTimeEntry(50L,
                new UpdateTimeEntryRequest(START, END), 3L))
                .isInstanceOf(ForbiddenActionException.class)
                .hasMessageContaining("not authorized to update");
    }

    @Test
    void updateTimeEntry_throwsIllegalArgument_whenTimerIsStillRunning() {
        Company company = company(10L);
        User manager = manager(1L, company);
        User worker = member(2L, company);
        ProjectWorker assignment = projectWorker(40L, worker, project(30L, workplace(20L, company)), null);
        TimeEntry entry = timeEntry(50L, assignment, Instant.now(), null);
        when(userService.findUser(1L)).thenReturn(manager);
        when(timeTrackingRepository.findById(50L)).thenReturn(Optional.of(entry));

        assertThatThrownBy(() -> timeTrackingService.updateTimeEntry(50L,
                new UpdateTimeEntryRequest(START, END), 1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Stop the running timer");
    }

    // ── deleteTimeEntry ─────────────────────────────────────────────────

    @Test
    void deleteTimeEntry_deletesEntry_whenManagerDeletesStoppedEntry() {
        Company company = company(10L);
        User manager = manager(1L, company);
        User worker = member(2L, company);
        ProjectWorker assignment = projectWorker(40L, worker, project(30L, workplace(20L, company)), null);
        TimeEntry entry = timeEntry(50L, assignment, START, END);
        when(userService.findUser(1L)).thenReturn(manager);
        when(timeTrackingRepository.findById(50L)).thenReturn(Optional.of(entry));

        timeTrackingService.deleteTimeEntry(50L, 1L);

        verify(timeTrackingRepository).delete(entry);
    }

    @Test
    void deleteTimeEntry_throwsForbidden_whenRequesterIsNotManager() {
        Company company = company(10L);
        User requester = member(3L, company);
        User worker = member(2L, company);
        ProjectWorker assignment = projectWorker(40L, worker, project(30L, workplace(20L, company)), null);
        TimeEntry entry = timeEntry(50L, assignment, START, END);
        when(userService.findUser(3L)).thenReturn(requester);
        when(timeTrackingRepository.findById(50L)).thenReturn(Optional.of(entry));

        assertThatThrownBy(() -> timeTrackingService.deleteTimeEntry(50L, 3L))
                .isInstanceOf(ForbiddenActionException.class)
                .hasMessageContaining("not authorized to delete");
    }

    @Test
    void deleteTimeEntry_throwsIllegalArgument_whenTimerIsStillRunning() {
        Company company = company(10L);
        User manager = manager(1L, company);
        User worker = member(2L, company);
        ProjectWorker assignment = projectWorker(40L, worker, project(30L, workplace(20L, company)), null);
        TimeEntry entry = timeEntry(50L, assignment, Instant.now(), null);
        when(userService.findUser(1L)).thenReturn(manager);
        when(timeTrackingRepository.findById(50L)).thenReturn(Optional.of(entry));

        assertThatThrownBy(() -> timeTrackingService.deleteTimeEntry(50L, 1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Stop the running timer");
    }
}