package com.example.logis.services;

import com.example.logis.data.entities.Company;
import com.example.logis.data.enums.CompanyRole;
import com.example.logis.data.entities.Location;
import com.example.logis.data.entities.Project;
import com.example.logis.data.enums.ProjectStatus;
import com.example.logis.data.entities.ProjectWorker;
import com.example.logis.data.entities.User;
import com.example.logis.data.entities.Workplace;
import com.example.logis.dtos.requests.CreateProjectRequest;
import com.example.logis.dtos.responses.ProjectResponse;
import com.example.logis.dtos.responses.UserResponse;
import com.example.logis.exceptions.ForbiddenActionException;
import com.example.logis.exceptions.ProjectNotFoundException;
import com.example.logis.exceptions.ResourceNotOwnedException;
import com.example.logis.repository.ProjectRepository;
import com.example.logis.repository.ProjectWorkerRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private ProjectWorkerRepository projectWorkerRepository;

    @Mock
    private CompanyService companyService;

    @Mock
    private WorkplaceService workplaceService;

    @Mock
    private UserService userService;

    @InjectMocks
    private ProjectService projectService;

    // Entity ids are @GeneratedValue; tests assign them via reflection where no setter exists.
    // Managers/members are added to company.getUsers() because authorization relies on
    // company.getManagers()/getUsers().contains(...) and getManagers() derives from users by role.
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

    // ── createProject ───────────────────────────────────────────────────

    @Test
    void createProject_savesProject_andAssignsCreatorAsWorker_whenManagerCreatesForOwnWorkplace() {
        Company company = company(10L);
        User creator = manager(1L, company);
        Workplace workplace = workplace(20L, company);
        Project savedProject = project(30L, workplace);
        when(userService.findUser(1L)).thenReturn(creator);
        when(companyService.findCompany(10L)).thenReturn(company);
        when(workplaceService.findWorkplace(20L)).thenReturn(workplace);
        when(projectRepository.save(any(Project.class))).thenReturn(savedProject);
        when(projectRepository.findById(30L)).thenReturn(Optional.of(savedProject));
        when(projectWorkerRepository.findByProject_IdAndWorker_Id(30L, 1L)).thenReturn(Optional.empty());

        ProjectResponse response = projectService.createProject(
                new CreateProjectRequest("Bridge", 20L, LocalDate.now().plusDays(1), null), 1L);

        assertThat(response.id()).isEqualTo(30L);
        assertThat(response.workplaceId()).isEqualTo(20L);
        verify(projectWorkerRepository).save(any(ProjectWorker.class));
    }

    @Test
    void createProject_throwsForbidden_whenCreatorIsNotManager() {
        Company company = company(10L);
        User creator = member(1L, company);
        when(userService.findUser(1L)).thenReturn(creator);
        when(companyService.findCompany(10L)).thenReturn(company);
        when(workplaceService.findWorkplace(20L)).thenReturn(workplace(20L, company));

        assertThatThrownBy(() -> projectService.createProject(
                new CreateProjectRequest("Bridge", 20L, LocalDate.now().plusDays(1), null), 1L))
                .isInstanceOf(ForbiddenActionException.class)
                .hasMessageContaining("not a manager");

        verify(projectRepository, never()).save(any());
    }

    @Test
    void createProject_throwsResourceNotOwned_whenWorkplaceBelongsToAnotherCompany() {
        User creator = manager(1L, company(10L));
        when(userService.findUser(1L)).thenReturn(creator);
        when(companyService.findCompany(10L)).thenReturn(creator.getCompany());
        when(workplaceService.findWorkplace(20L)).thenReturn(workplace(20L, company(99L)));

        assertThatThrownBy(() -> projectService.createProject(
                new CreateProjectRequest("Bridge", 20L, LocalDate.now().plusDays(1), null), 1L))
                .isInstanceOf(ResourceNotOwnedException.class)
                .hasMessageContaining("does not belong");
    }

    // ── lookups ─────────────────────────────────────────────────────────

    @Test
    void findProject_throwsProjectNotFound_whenProjectDoesNotExist() {
        when(projectRepository.findById(42L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> projectService.findProject(42L))
                .isInstanceOf(ProjectNotFoundException.class);
    }

    @Test
    void getProjectForUser_returnsProject_whenUserBelongsToCompany() {
        Company company = company(10L);
        User user = member(2L, company);
        Project project = project(30L, workplace(20L, company));
        when(userService.findUser(2L)).thenReturn(user);
        when(projectRepository.findById(30L)).thenReturn(Optional.of(project));

        ProjectResponse response = projectService.getProjectForUser(30L, 2L);

        assertThat(response.id()).isEqualTo(30L);
    }

    @Test
    void getProjectForUser_throwsForbidden_whenUserIsOutsider() {
        Company company = company(10L);
        User outsider = user(2L, CompanyRole.USER, company(99L));
        Project project = project(30L, workplace(20L, company));
        when(userService.findUser(2L)).thenReturn(outsider);
        when(projectRepository.findById(30L)).thenReturn(Optional.of(project));

        assertThatThrownBy(() -> projectService.getProjectForUser(30L, 2L))
                .isInstanceOf(ForbiddenActionException.class)
                .hasMessageContaining("not part of the company");
    }

    @Test
    void getWorkplaceProjectsForUser_returnsOnlyActiveAssignments_forRegularMember() {
        Company company = company(10L);
        User user = member(2L, company);
        Workplace workplace = workplace(20L, company);
        Project assigned = project(30L, workplace);
        when(userService.findUser(2L)).thenReturn(user);
        when(workplaceService.findWorkplace(20L)).thenReturn(workplace);
        when(projectWorkerRepository.findByWorker_IdAndProject_Workplace_IdAndEndDateIsNull(2L, 20L))
                .thenReturn(List.of(projectWorker(40L, user, assigned, null)));

        List<ProjectResponse> projects = projectService.getWorkplaceProjectsForUser(20L, 2L);

        assertThat(projects).hasSize(1);
        assertThat(projects.get(0).id()).isEqualTo(30L);
        verify(projectRepository, never()).findByWorkplace_Id(20L);
    }

    @Test
    void getWorkplaceProjectsForUser_returnsAllProjects_forManager() {
        Company company = company(10L);
        User manager = manager(1L, company);
        Workplace workplace = workplace(20L, company);
        Project project = project(30L, workplace);
        when(userService.findUser(1L)).thenReturn(manager);
        when(workplaceService.findWorkplace(20L)).thenReturn(workplace);
        when(projectRepository.findByWorkplace_Id(20L)).thenReturn(List.of(project));

        List<ProjectResponse> projects = projectService.getWorkplaceProjectsForUser(20L, 1L);

        assertThat(projects).hasSize(1);
        assertThat(projects.get(0).id()).isEqualTo(30L);
        verify(projectWorkerRepository, never()).findByWorker_IdAndProject_Workplace_IdAndEndDateIsNull(anyLong(), anyLong());
    }

    @Test
    void getWorkplaceProjectsForUser_throwsForbidden_whenUserIsOutsider() {
        Company company = company(10L);
        User outsider = user(2L, CompanyRole.USER, company(99L));
        when(userService.findUser(2L)).thenReturn(outsider);
        when(workplaceService.findWorkplace(20L)).thenReturn(workplace(20L, company));

        assertThatThrownBy(() -> projectService.getWorkplaceProjectsForUser(20L, 2L))
                .isInstanceOf(ForbiddenActionException.class);
    }

    // ── updateProjectStatus ─────────────────────────────────────────────

    @Test
    void updateProjectStatus_setsStatus_whenManagerOfOwningCompany() {
        Company company = company(10L);
        User requester = manager(1L, company);
        Project project = project(30L, workplace(20L, company));
        when(userService.findUser(1L)).thenReturn(requester);
        when(projectRepository.findById(30L)).thenReturn(Optional.of(project));
        when(projectRepository.save(project)).thenReturn(project);

        ProjectResponse response = projectService.updateProjectStatus(30L, ProjectStatus.ACTIVE, 1L);

        assertThat(response.projectStatus()).isEqualTo(ProjectStatus.ACTIVE);
        verify(projectRepository).save(project);
    }

    @Test
    void updateProjectStatus_throwsForbidden_whenRequesterIsNotManager() {
        Company company = company(10L);
        User requester = member(1L, company);
        Project project = project(30L, workplace(20L, company));
        project.setProjectStatus(ProjectStatus.PENDING);
        when(userService.findUser(1L)).thenReturn(requester);
        when(projectRepository.findById(30L)).thenReturn(Optional.of(project));

        assertThatThrownBy(() -> projectService.updateProjectStatus(30L, ProjectStatus.ACTIVE, 1L))
                .isInstanceOf(ForbiddenActionException.class)
                .hasMessageContaining("not a manager");

        assertThat(project.getProjectStatus()).isEqualTo(ProjectStatus.PENDING);
    }

    @Test
    void updateProjectStatus_throwsForbidden_whenProjectBelongsToAnotherCompany() {
        User requester = manager(1L, company(10L));
        Project project = project(30L, workplace(20L, company(99L)));
        when(userService.findUser(1L)).thenReturn(requester);
        when(projectRepository.findById(30L)).thenReturn(Optional.of(project));

        assertThatThrownBy(() -> projectService.updateProjectStatus(30L, ProjectStatus.ACTIVE, 1L))
                .isInstanceOf(ForbiddenActionException.class);
    }

    // ── assignWorker ────────────────────────────────────────────────────

    @Test
    void assignWorker_createsAssignment_whenWorkerBelongsToAssignersCompany() {
        Company company = company(10L);
        User assigner = manager(1L, company);
        User worker = member(2L, company);
        Project project = project(30L, workplace(20L, company));
        when(projectRepository.findById(30L)).thenReturn(Optional.of(project));
        when(userService.findUser(2L)).thenReturn(worker);
        when(userService.findUser(1L)).thenReturn(assigner);
        when(companyService.findCompany(10L)).thenReturn(company);
        when(projectWorkerRepository.findByProject_IdAndWorker_Id(30L, 2L)).thenReturn(Optional.empty());

        projectService.assignWorker(30L, 2L, 1L);

        verify(projectWorkerRepository).save(any(ProjectWorker.class));
    }

    @Test
    void assignWorker_throwsForbidden_whenWorkerBelongsToAnotherCompany() {
        Company company = company(10L);
        User assigner = manager(1L, company);
        User worker = member(2L, company(20L));
        Project project = project(30L, workplace(20L, company));
        when(projectRepository.findById(30L)).thenReturn(Optional.of(project));
        when(userService.findUser(2L)).thenReturn(worker);
        when(userService.findUser(1L)).thenReturn(assigner);
        when(companyService.findCompany(10L)).thenReturn(company);

        assertThatThrownBy(() -> projectService.assignWorker(30L, 2L, 1L))
                .isInstanceOf(ForbiddenActionException.class)
                .hasMessageContaining("not part of the assigner's company");
    }

    @Test
    void assignWorker_throwsForbidden_whenWorkerIsAlreadyActivelyAssigned() {
        Company company = company(10L);
        User assigner = manager(1L, company);
        User worker = member(2L, company);
        Project project = project(30L, workplace(20L, company));
        ProjectWorker existing = projectWorker(40L, worker, project, null);
        when(projectRepository.findById(30L)).thenReturn(Optional.of(project));
        when(userService.findUser(2L)).thenReturn(worker);
        when(userService.findUser(1L)).thenReturn(assigner);
        when(companyService.findCompany(10L)).thenReturn(company);
        when(projectWorkerRepository.findByProject_IdAndWorker_Id(30L, 2L)).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> projectService.assignWorker(30L, 2L, 1L))
                .isInstanceOf(ForbiddenActionException.class)
                .hasMessageContaining("already assigned");
    }

    @Test
    void assignWorker_reactivatesAssignment_whenWorkerWasRemovedBefore() {
        Company company = company(10L);
        User assigner = manager(1L, company);
        User worker = member(2L, company);
        Project project = project(30L, workplace(20L, company));
        ProjectWorker ended = projectWorker(40L, worker, project, LocalDate.now().minusDays(1));
        when(projectRepository.findById(30L)).thenReturn(Optional.of(project));
        when(userService.findUser(2L)).thenReturn(worker);
        when(userService.findUser(1L)).thenReturn(assigner);
        when(companyService.findCompany(10L)).thenReturn(company);
        when(projectWorkerRepository.findByProject_IdAndWorker_Id(30L, 2L)).thenReturn(Optional.of(ended));

        projectService.assignWorker(30L, 2L, 1L);

        assertThat(ended.getEndDate()).isNull();
        assertThat(ended.getAssignedAt()).isEqualTo(LocalDate.now());
        verify(projectWorkerRepository).save(ended);
    }

    // ── project workers ─────────────────────────────────────────────────

    @Test
    void getProjectWorkers_returnsOnlyActiveWorkers() {
        Company company = company(10L);
        User viewer = member(2L, company);
        Project project = project(30L, workplace(20L, company));
        User activeWorker = member(3L, company);
        ProjectWorker active = projectWorker(40L, activeWorker, project, null);
        ProjectWorker removed = projectWorker(41L, member(4L, company), project, LocalDate.now().minusDays(1));
        when(userService.findUser(2L)).thenReturn(viewer);
        when(projectRepository.findById(30L)).thenReturn(Optional.of(project));
        when(projectWorkerRepository.findByProject_Id(30L)).thenReturn(List.of(active, removed));
        when(userService.toResponse(activeWorker)).thenReturn(
                new UserResponse(3L, "John", "Doe", "johndoe", "john3@acme.com", CompanyRole.USER, 10L));

        List<UserResponse> workers = projectService.getProjectWorkers(30L, 2L);

        assertThat(workers).hasSize(1);
        assertThat(workers.get(0).id()).isEqualTo(3L);
    }

    // ── removeWorker ────────────────────────────────────────────────────

    @Test
    void removeWorker_setsEndDate_whenManagerRemovesAssignedWorker() {
        Company company = company(10L);
        User requester = manager(1L, company);
        User worker = member(2L, company);
        Project project = project(30L, workplace(20L, company));
        ProjectWorker assignment = projectWorker(40L, worker, project, null);
        when(userService.findUser(1L)).thenReturn(requester);
        when(projectRepository.findById(30L)).thenReturn(Optional.of(project));
        when(companyService.findCompany(10L)).thenReturn(company);
        when(projectWorkerRepository.findByProject_IdAndWorker_Id(30L, 2L)).thenReturn(Optional.of(assignment));

        projectService.removeWorker(30L, 2L, 1L);

        assertThat(assignment.getEndDate()).isEqualTo(LocalDate.now());
        verify(projectWorkerRepository).save(assignment);
    }

    @Test
    void removeWorker_throwsForbidden_whenRequesterTriesToRemoveHimself() {
        Company company = company(10L);
        User requester = manager(1L, company);
        when(userService.findUser(1L)).thenReturn(requester);
        when(projectRepository.findById(30L)).thenReturn(Optional.of(project(30L, workplace(20L, company))));

        assertThatThrownBy(() -> projectService.removeWorker(30L, 1L, 1L))
                .isInstanceOf(ForbiddenActionException.class)
                .hasMessageContaining("remove himself");
    }

    @Test
    void removeWorker_throwsForbidden_whenWorkerIsNotAssignedToProject() {
        Company company = company(10L);
        User requester = manager(1L, company);
        when(userService.findUser(1L)).thenReturn(requester);
        when(projectRepository.findById(30L)).thenReturn(Optional.of(project(30L, workplace(20L, company))));
        when(companyService.findCompany(10L)).thenReturn(company);
        when(projectWorkerRepository.findByProject_IdAndWorker_Id(30L, 2L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> projectService.removeWorker(30L, 2L, 1L))
                .isInstanceOf(ForbiddenActionException.class)
                .hasMessageContaining("not assigned");
    }
}