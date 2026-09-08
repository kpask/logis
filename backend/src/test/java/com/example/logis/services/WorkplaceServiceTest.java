package com.example.logis.services;

import com.example.logis.data.Company;
import com.example.logis.data.enums.CompanyRole;
import com.example.logis.data.Location;
import com.example.logis.data.User;
import com.example.logis.data.Workplace;
import com.example.logis.dtos.CreateWorkplaceRequest;
import com.example.logis.dtos.UpdateWorkplaceRequest;
import com.example.logis.dtos.WorkplaceResponse;
import com.example.logis.exceptions.ForbiddenActionException;
import com.example.logis.exceptions.WorkplaceNotFoundException;
import com.example.logis.repository.WorkplaceRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WorkplaceServiceTest {

    @Mock
    private WorkplaceRepository workplaceRepository;

    @Mock
    private CompanyService companyService;

    @Mock
    private UserService userService;

    @InjectMocks
    private WorkplaceService workplaceService;

    // Entity ids are @GeneratedValue; tests assign them via reflection where no setter exists.
    // The manager is added to company.getUsers() because authorization relies on
    // company.getManagers().contains(...) and getManagers() derives from users by role.
    private static User user(Long id, CompanyRole role, Company company) {
        User user = new User("John", "Doe", "johndoe", "john@acme.com", "password-hash", role);
        user.setCompany(company);
        ReflectionTestUtils.setField(user, "id", id);
        return user;
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

    // ── createWorkplace ─────────────────────────────────────────────────

    @Test
    void createWorkplace_savesWorkplace_whenManagerCreatesForOwnCompany() {
        Company company = company(10L);
        User manager = user(1L, CompanyRole.MANAGER, company);
        company.getUsers().add(manager);
        Workplace saved = workplace(20L, company);
        when(userService.findUser(1L)).thenReturn(manager);
        when(companyService.findCompany(10L)).thenReturn(company);
        when(workplaceRepository.save(any(Workplace.class))).thenReturn(saved);

        WorkplaceResponse response = workplaceService.createWorkplace(
                new CreateWorkplaceRequest("Site A", new Location(54.68, 25.28, "Vilnius", "Gedimino", "Gedimino pr. 1"), null), 1L);

        assertThat(response.id()).isEqualTo(20L);
        assertThat(response.name()).isEqualTo("Site A");
        assertThat(response.companyId()).isEqualTo(10L);
        // null radius on create falls back to the 150 m default fence
        assertThat(response.radiusDistance()).isEqualTo(150.0);
    }

    @Test
    void createWorkplace_usesRequestedRadius_whenProvided() {
        Company company = company(10L);
        User manager = user(1L, CompanyRole.MANAGER, company);
        company.getUsers().add(manager);
        Workplace saved = workplace(20L, company);
        saved.setRadiusMeters(500.0);
        when(userService.findUser(1L)).thenReturn(manager);
        when(companyService.findCompany(10L)).thenReturn(company);
        when(workplaceRepository.save(any(Workplace.class))).thenReturn(saved);

        WorkplaceResponse response = workplaceService.createWorkplace(
                new CreateWorkplaceRequest("Site A", new Location(54.68, 25.28, "Vilnius", "Gedimino", "Gedimino pr. 1"), 500.0), 1L);

        assertThat(response.radiusDistance()).isEqualTo(500.0);
    }

    @Test
    void createWorkplace_throwsForbidden_whenUserHasNoCompany() {
        when(userService.findUser(1L)).thenReturn(user(1L, CompanyRole.MANAGER, null));

        assertThatThrownBy(() -> workplaceService.createWorkplace(
                new CreateWorkplaceRequest("Site A", new Location(54.68, 25.28, "Vilnius", "Gedimino", "Gedimino pr. 1"), null), 1L))
                .isInstanceOf(ForbiddenActionException.class)
                .hasMessageContaining("not part of any company");

        verify(workplaceRepository, never()).save(any());
    }

    @Test
    void createWorkplace_throwsForbidden_whenUserIsNotManager() {
        Company company = company(10L);
        User user = user(1L, CompanyRole.USER, company);
        company.getUsers().add(user);
        when(userService.findUser(1L)).thenReturn(user);
        when(companyService.findCompany(10L)).thenReturn(company);

        assertThatThrownBy(() -> workplaceService.createWorkplace(
                new CreateWorkplaceRequest("Site A", new Location(54.68, 25.28, "Vilnius", "Gedimino", "Gedimino pr. 1"), null), 1L))
                .isInstanceOf(ForbiddenActionException.class)
                .hasMessageContaining("not a manager");

        verify(workplaceRepository, never()).save(any());
    }

    // ── lookups ─────────────────────────────────────────────────────────

    @Test
    void findWorkplace_throwsWorkplaceNotFound_whenWorkplaceDoesNotExist() {
        when(workplaceRepository.findById(42L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> workplaceService.findWorkplace(42L))
                .isInstanceOf(WorkplaceNotFoundException.class);
    }

    @Test
    void getWorkplacesByUser_returnsMappedWorkplaces_ofUsersCompany() {
        Company company = company(10L);
        User user = user(1L, CompanyRole.USER, company);
        company.getWorkplaces().add(workplace(20L, company));
        company.getWorkplaces().add(workplace(21L, company));
        when(userService.findUser(1L)).thenReturn(user);

        List<WorkplaceResponse> workplaces = workplaceService.getWorkplacesByUser(1L);

        assertThat(workplaces).hasSize(2);
        assertThat(workplaces).extracting(WorkplaceResponse::id)
                .containsExactly(20L, 21L);
    }

    @Test
    void getWorkplacesByCompanyId_returnsMappedWorkplaces() {
        Company company = company(10L);
        company.getWorkplaces().add(workplace(20L, company));
        when(companyService.findCompany(10L)).thenReturn(company);

        List<WorkplaceResponse> workplaces = workplaceService.getWorkplacesByCompanyId(10L);

        assertThat(workplaces).hasSize(1);
        assertThat(workplaces.get(0).id()).isEqualTo(20L);
    }

    @Test
    void getWorkplaceByWorkplaceIdAndUser_returnsWorkplace_whenUserBelongsToOwningCompany() {
        Company company = company(10L);
        User user = user(1L, CompanyRole.USER, company);
        Workplace workplace = workplace(20L, company);
        when(userService.findUser(1L)).thenReturn(user);
        when(workplaceRepository.findById(20L)).thenReturn(Optional.of(workplace));

        WorkplaceResponse response = workplaceService.getWorkplaceByWorkplaceIdAndUser(20L, 1L);

        assertThat(response.id()).isEqualTo(20L);
    }

    @Test
    void getWorkplaceByWorkplaceIdAndUser_throwsForbidden_whenUserBelongsToAnotherCompany() {
        User user = user(1L, CompanyRole.USER, company(20L));
        Workplace workplace = workplace(30L, company(10L));
        when(userService.findUser(1L)).thenReturn(user);
        when(workplaceRepository.findById(30L)).thenReturn(Optional.of(workplace));

        assertThatThrownBy(() -> workplaceService.getWorkplaceByWorkplaceIdAndUser(30L, 1L))
                .isInstanceOf(ForbiddenActionException.class)
                .hasMessageContaining("not part of the company");
    }

    // ── deleteWorkplace ─────────────────────────────────────────────────

    @Test
    void deleteWorkplace_deletesWorkplace_whenUserBelongsToOwningCompany() {
        Company company = company(10L);
        User manager = user(1L, CompanyRole.MANAGER, company);
        company.getUsers().add(manager);
        Workplace workplace = workplace(20L, company);
        when(userService.findUser(1L)).thenReturn(manager);
        when(workplaceRepository.findById(20L)).thenReturn(Optional.of(workplace));

        workplaceService.deleteWorkplaceByWorkplaceIdAndUser(20L, 1L);

        verify(workplaceRepository).delete(workplace);
    }

    @Test
    void deleteWorkplace_throwsForbidden_whenUserBelongsToAnotherCompany() {
        User user = user(1L, CompanyRole.USER, company(20L));
        Workplace workplace = workplace(30L, company(10L));
        when(userService.findUser(1L)).thenReturn(user);
        when(workplaceRepository.findById(30L)).thenReturn(Optional.of(workplace));

        assertThatThrownBy(() -> workplaceService.deleteWorkplaceByWorkplaceIdAndUser(30L, 1L))
                .isInstanceOf(ForbiddenActionException.class);

        verify(workplaceRepository, never()).delete(any());
    }

    // ── updateWorkplace ─────────────────────────────────────────────────

    @Test
    void updateWorkplace_updatesFields_whenManagerOfOwningCompany() {
        Company company = company(10L);
        User manager = user(1L, CompanyRole.MANAGER, company);
        company.getUsers().add(manager);
        Workplace workplace = workplace(20L, company);
        when(userService.findUser(1L)).thenReturn(manager);
        when(workplaceRepository.findById(20L)).thenReturn(Optional.of(workplace));
        when(workplaceRepository.save(workplace)).thenReturn(workplace);

        WorkplaceResponse response = workplaceService.updateWorkplace(20L, 1L,
                new UpdateWorkplaceRequest("Site B", new Location(55.0, 25.0, "Kaunas", "Laisvės", "Laisvės al. 1"), 300.0));

        assertThat(response.name()).isEqualTo("Site B");
        assertThat(response.location().getCity()).isEqualTo("Kaunas");
        assertThat(response.radiusDistance()).isEqualTo(300.0);
        verify(workplaceRepository).save(workplace);
    }

    @Test
    void updateWorkplace_keepsExistingRadius_whenRadiusIsOmitted() {
        Company company = company(10L);
        User manager = user(1L, CompanyRole.MANAGER, company);
        company.getUsers().add(manager);
        Workplace workplace = workplace(20L, company);
        workplace.setRadiusMeters(400.0);
        when(userService.findUser(1L)).thenReturn(manager);
        when(workplaceRepository.findById(20L)).thenReturn(Optional.of(workplace));
        when(workplaceRepository.save(workplace)).thenReturn(workplace);

        workplaceService.updateWorkplace(20L, 1L, new UpdateWorkplaceRequest("Site B", null, null));

        // partial update: radius untouched when the field is omitted
        assertThat(workplace.getRadiusMeters()).isEqualTo(400.0);
    }

    @Test
    void updateWorkplace_throwsForbidden_whenUserIsNotManager() {
        Company company = company(10L);
        User user = user(1L, CompanyRole.USER, company);
        when(userService.findUser(1L)).thenReturn(user);
        when(workplaceRepository.findById(20L)).thenReturn(Optional.of(workplace(20L, company)));

        assertThatThrownBy(() -> workplaceService.updateWorkplace(20L, 1L,
                new UpdateWorkplaceRequest("Site B", null, null)))
                .isInstanceOf(ForbiddenActionException.class);

        verify(workplaceRepository, never()).save(any());
    }

    @Test
    void updateWorkplace_throwsForbidden_whenUserBelongsToAnotherCompany() {
        User manager = user(1L, CompanyRole.MANAGER, company(99L));
        when(userService.findUser(1L)).thenReturn(manager);
        when(workplaceRepository.findById(20L)).thenReturn(Optional.of(workplace(20L, company(10L))));

        assertThatThrownBy(() -> workplaceService.updateWorkplace(20L, 1L,
                new UpdateWorkplaceRequest("Site B", null, null)))
                .isInstanceOf(ForbiddenActionException.class)
                .hasMessageContaining("not authorized to update workplace");
    }
}
