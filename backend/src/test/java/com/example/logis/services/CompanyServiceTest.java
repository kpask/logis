package com.example.logis.services;

import com.example.logis.data.entities.Company;
import com.example.logis.data.enums.CompanyRole;
import com.example.logis.data.entities.ProjectWorker;
import com.example.logis.data.entities.User;
import com.example.logis.dtos.requests.AddUserToCompanyRequest;
import com.example.logis.dtos.responses.CompanyResponse;
import com.example.logis.dtos.requests.CreateCompanyRequest;
import com.example.logis.dtos.responses.UserResponse;
import com.example.logis.exceptions.CompanyNotFoundException;
import com.example.logis.exceptions.ForbiddenActionException;
import com.example.logis.repository.CompanyRepository;
import com.example.logis.repository.ProjectWorkerRepository;
import com.example.logis.repository.UserRepository;
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
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CompanyServiceTest {
    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserService userService;

    @Mock
    private ProjectWorkerRepository projectWorkerRepository;

    @InjectMocks
    private CompanyService companyService;

    // User/Company ids are @GeneratedValue and have no setters, so tests assign them via reflection.
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

    // ── getCompanyById / getCompanyByUser ───────────────────────────────

    @Test
    void getCompanyById_throwsIllegalArgument_whenIdIsNullOrNotPositive() {
        assertThatThrownBy(() -> companyService.getCompanyById(null))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> companyService.getCompanyById(0L))
                .isInstanceOf(IllegalArgumentException.class);
        verifyNoInteractions(companyRepository);
    }

    @Test
    void getCompanyById_returnsResponse_whenCompanyExists() {
        when(companyRepository.findById(10L)).thenReturn(Optional.of(company(10L)));

        CompanyResponse response = companyService.getCompanyById(10L);

        assertThat(response.id()).isEqualTo(10L);
        assertThat(response.name()).isEqualTo("Acme Ltd");
    }

    @Test
    void getCompanyById_throwsCompanyNotFound_whenCompanyDoesNotExist() {
        when(companyRepository.findById(42L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> companyService.getCompanyById(42L))
                .isInstanceOf(CompanyNotFoundException.class);
    }

    @Test
    void getCompanyByUser_returnsResponse_whenUserHasCompany() {
        when(userService.findUser(1L)).thenReturn(user(1L, CompanyRole.USER, company(10L)));

        CompanyResponse response = companyService.getCompanyByUser(1L);

        assertThat(response.id()).isEqualTo(10L);
        assertThat(response.name()).isEqualTo("Acme Ltd");
    }

    @Test
    void getCompanyByUser_throwsIllegalArgument_whenUserHasNoCompany() {
        when(userService.findUser(1L)).thenReturn(user(1L, CompanyRole.USER, null));

        assertThatThrownBy(() -> companyService.getCompanyByUser(1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("not associated");
    }

    // ── addUserToCompany ────────────────────────────────────────────────

    @Test
    void addUserToCompany_setsManagerRole_whenRequested() {
        Company company = company(10L);
        User user = user(5L, CompanyRole.USER, null);
        when(companyRepository.findById(10L)).thenReturn(Optional.of(company));
        when(userRepository.findById(5L)).thenReturn(Optional.of(user));

        companyService.addUserToCompany(new AddUserToCompanyRequest(5L, true), 10L);

        assertThat(user.getCompany()).isSameAs(company);
        assertThat(user.getRole()).isEqualTo(CompanyRole.MANAGER);
    }

    @Test
    void addUserToCompany_setsUserRole_whenNotRequested() {
        Company company = company(10L);
        User user = user(5L, CompanyRole.MANAGER, null);
        when(companyRepository.findById(10L)).thenReturn(Optional.of(company));
        when(userRepository.findById(5L)).thenReturn(Optional.of(user));

        companyService.addUserToCompany(new AddUserToCompanyRequest(5L, false), 10L);

        assertThat(user.getCompany()).isSameAs(company);
        assertThat(user.getRole()).isEqualTo(CompanyRole.USER);
    }

    // ── makeCompanyManager ──────────────────────────────────────────────

    @Test
    void makeCompanyManager_promotesUser_whenPromoterIsOwnerOfSameCompany() {
        Company company = company(10L);
        User promoter = user(1L, CompanyRole.OWNER, company);
        User target = user(2L, CompanyRole.USER, company);
        when(userService.findUser(1L)).thenReturn(promoter);
        when(userService.findUser(2L)).thenReturn(target);

        companyService.makeCompanyManager(2L, 1L);

        assertThat(target.getRole()).isEqualTo(CompanyRole.MANAGER);
    }

    @Test
    void makeCompanyManager_throwsForbidden_whenPromoterIsNotOwner() {
        Company company = company(10L);
        User promoter = user(1L, CompanyRole.USER, company);
        User target = user(2L, CompanyRole.USER, company);
        when(userService.findUser(1L)).thenReturn(promoter);
        when(userService.findUser(2L)).thenReturn(target);

        assertThatThrownBy(() -> companyService.makeCompanyManager(2L, 1L))
                .isInstanceOf(ForbiddenActionException.class)
                .hasMessageContaining("Only owners");

        assertThat(target.getRole()).isEqualTo(CompanyRole.USER);
    }

    @Test
    void makeCompanyManager_throwsForbidden_whenUsersBelongToDifferentCompanies() {
        User promoter = user(1L, CompanyRole.OWNER, company(10L));
        User target = user(2L, CompanyRole.USER, company(20L));
        when(userService.findUser(1L)).thenReturn(promoter);
        when(userService.findUser(2L)).thenReturn(target);

        assertThatThrownBy(() -> companyService.makeCompanyManager(2L, 1L))
                .isInstanceOf(ForbiddenActionException.class)
                .hasMessageContaining("same company");
    }

    // ── createCompany ───────────────────────────────────────────────────

    @Test
    void createCompany_savesCompany_linksManager_andReturnsResponse() {
        User manager = user(1L, CompanyRole.USER, null);
        when(userService.findUser(1L)).thenReturn(manager);
        when(companyRepository.save(any(Company.class))).thenAnswer(inv -> {
            Company saved = inv.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", 10L);
            return saved;
        });

        CompanyResponse response = companyService.createCompany(new CreateCompanyRequest("Acme Ltd"), 1L);

        assertThat(response.id()).isEqualTo(10L);
        assertThat(response.name()).isEqualTo("Acme Ltd");
        assertThat(manager.getCompany()).isNotNull();
        assertThat(manager.getCompany().getId()).isEqualTo(10L);
        assertThat(manager.getRole()).isEqualTo(CompanyRole.OWNER);
        verify(userRepository).save(manager);
    }

    // ── member counts & lists ───────────────────────────────────────────

    @Test
    void getWorkerCountByUser_throwsIllegalArgument_whenUserHasNoCompany() {
        when(userService.findUser(1L)).thenReturn(user(1L, CompanyRole.USER, null));

        assertThatThrownBy(() -> companyService.getWorkerCountByUser(1L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void getMembersByUser_returnsMappedMembers_ofRequestersCompany() {
        User requester = user(1L, CompanyRole.MANAGER, company(10L));
        User member1 = user(2L, CompanyRole.USER, requester.getCompany());
        User member2 = user(3L, CompanyRole.USER, requester.getCompany());
        when(userService.findUser(1L)).thenReturn(requester);
        when(userRepository.findByCompanyId(10L)).thenReturn(List.of(member1, member2));
        UserResponse resp1 = new UserResponse(2L, "John", "Doe", "johndoe", "john@acme.com", CompanyRole.USER, 10L);
        UserResponse resp2 = new UserResponse(3L, "John", "Doe", "johndoe", "john@acme.com", CompanyRole.USER, 10L);
        when(userService.toResponse(member1)).thenReturn(resp1);
        when(userService.toResponse(member2)).thenReturn(resp2);

        List<UserResponse> members = companyService.getMembersByUser(1L);

        assertThat(members).containsExactly(resp1, resp2);
    }

    @Test
    void getMembersByUser_throwsForbidden_whenRequesterHasNoCompany() {
        when(userService.findUser(1L)).thenReturn(user(1L, CompanyRole.USER, null));

        assertThatThrownBy(() -> companyService.getMembersByUser(1L))
                .isInstanceOf(ForbiddenActionException.class);
    }

    // ── kick ────────────────────────────────────────────────────────────

    @Test
    void kick_removesUserFromCompany_andDeletesProjectAssignments_whenKickerIsOwner() {
        Company company = company(10L);
        User kicker = user(1L, CompanyRole.OWNER, company);
        User kicked = user(2L, CompanyRole.USER, company);
        ProjectWorker assignment = new ProjectWorker();
        when(userService.findUser(2L)).thenReturn(kicked);
        when(userService.findUser(1L)).thenReturn(kicker);
        when(projectWorkerRepository.findByWorker_Id(2L)).thenReturn(List.of(assignment));

        companyService.kick(2L, 1L);

        assertThat(kicked.getCompany()).isNull();
        assertThat(kicked.getRole()).isEqualTo(CompanyRole.USER);
        verify(projectWorkerRepository).deleteAll(List.of(assignment));
    }

    @Test
    void kick_throwsForbidden_whenKickerIsNotManager() {
        Company company = company(10L);
        User kicker = user(1L, CompanyRole.USER, company);
        User kicked = user(2L, CompanyRole.USER, company);
        when(userService.findUser(2L)).thenReturn(kicked);
        when(userService.findUser(1L)).thenReturn(kicker);

        assertThatThrownBy(() -> companyService.kick(2L, 1L))
                .isInstanceOf(ForbiddenActionException.class)
                .hasMessageContaining("not authorized to kick others");

        assertThat(kicked.getCompany()).isSameAs(company);
    }

    @Test
    void kick_throwsIllegalArgument_whenKickerKicksHimself() {
        User kicker = user(1L, CompanyRole.OWNER, company(10L));
        when(userService.findUser(1L)).thenReturn(kicker);

        assertThatThrownBy(() -> companyService.kick(1L, 1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("himself");
    }

    @Test
    void kick_throwsIllegalArgument_whenVictimHasNoCompany() {
        User kicker = user(1L, CompanyRole.OWNER, company(10L));
        User kicked = user(2L, CompanyRole.USER, null);
        when(userService.findUser(2L)).thenReturn(kicked);
        when(userService.findUser(1L)).thenReturn(kicker);

        assertThatThrownBy(() -> companyService.kick(2L, 1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("not associated with a company");
    }

    @Test
    void kick_throwsIllegalArgument_whenVictimBelongsToDifferentCompany() {
        User kicker = user(1L, CompanyRole.OWNER, company(10L));
        User kicked = user(2L, CompanyRole.USER, company(20L));
        when(userService.findUser(2L)).thenReturn(kicked);
        when(userService.findUser(1L)).thenReturn(kicker);

        assertThatThrownBy(() -> companyService.kick(2L, 1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("not associated with a company");
    }
}
