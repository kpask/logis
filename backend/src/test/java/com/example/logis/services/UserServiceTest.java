package com.example.logis.services;

import com.example.logis.data.entities.Company;
import com.example.logis.data.enums.CompanyRole;
import com.example.logis.data.entities.User;
import com.example.logis.dtos.responses.UserResponse;
import com.example.logis.exceptions.UserNotFoundException;
import com.example.logis.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    private static final Long REQUESTER_ID = 1L;
    private static final Long TARGET_ID = 2L;

    @Mock
    private UserRepository userRepository;
    @InjectMocks
    private UserService userService;

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

    @Test
    void findUser_throwsUserNotFoundException_whenUserDoesNotExist() {
        when(userRepository.findById(42L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.findUser(42L))
                .isInstanceOf(UserNotFoundException.class)
                .hasMessageContaining("42");
    }

    @Test
    void getUserById_mapsAllFieldsIntoResponse() {
        User user = new User("Jane", "Smith", "janesmith", "jane@acme.com", "secret", CompanyRole.MANAGER);
        user.setCompany(company(5L));
        ReflectionTestUtils.setField(user, "id", 7L);
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));

        UserResponse response = userService.getUserById(7L);

        assertThat(response.id()).isEqualTo(7L);
        assertThat(response.name()).isEqualTo("Jane");
        assertThat(response.lastname()).isEqualTo("Smith");
        assertThat(response.username()).isEqualTo("janesmith");
        assertThat(response.email()).isEqualTo("jane@acme.com");
        assertThat(response.companyRole()).isEqualTo(CompanyRole.MANAGER);
        assertThat(response.companyId()).isEqualTo(5L);
    }

    @Test
    void getUserById_returnsNullCompanyId_whenUserHasNoCompany() {
        User user = user(REQUESTER_ID, CompanyRole.USER, null);
        when(userRepository.findById(REQUESTER_ID)).thenReturn(Optional.of(user));

        UserResponse response = userService.getUserById(REQUESTER_ID);

        assertThat(response.companyId()).isNull();
    }

    @Test
    void toResponse_defaultsMissingRoleToUser() {
        User user = new User("John", "Doe", "johndoe", "john@acme.com", "password-hash", (CompanyRole) null);
        ReflectionTestUtils.setField(user, "id", REQUESTER_ID);

        UserResponse response = userService.toResponse(user);

        assertThat(response.companyRole()).isEqualTo(CompanyRole.USER);
        assertThat(response.companyId()).isNull();
    }

    @Test
    void getUserByIdAndUser_returnsTarget_whenBothBelongToSameCompany() {
        Company company = company(10L);
        User requester = user(REQUESTER_ID, CompanyRole.MANAGER, company);
        User target = user(TARGET_ID, CompanyRole.USER, company);
        when(userRepository.findById(REQUESTER_ID)).thenReturn(Optional.of(requester));
        when(userRepository.findById(TARGET_ID)).thenReturn(Optional.of(target));

        UserResponse response = userService.getUserByIdAndUser(TARGET_ID, REQUESTER_ID);

        assertThat(response.id()).isEqualTo(TARGET_ID);
        assertThat(response.companyId()).isEqualTo(10L);
        // exactly two lookups: requester + target (no redundant re-fetch)
        verify(userRepository).findById(REQUESTER_ID);
        verify(userRepository).findById(TARGET_ID);
    }

    @Test
    void getUserByIdAndUser_allowsSelfLookup_whenUserBelongsToCompany() {
        Company company = company(10L);
        User requester = user(REQUESTER_ID, CompanyRole.USER, company);
        when(userRepository.findById(REQUESTER_ID)).thenReturn(Optional.of(requester));

        UserResponse response = userService.getUserByIdAndUser(REQUESTER_ID, REQUESTER_ID);

        assertThat(response.id()).isEqualTo(REQUESTER_ID);
    }

    @Test
    void getUserByIdAndUser_throwsIllegalArgument_whenRequesterHasNoCompany() {
        User requester = user(REQUESTER_ID, CompanyRole.USER, null);
        User target = user(TARGET_ID, CompanyRole.USER, company(10L));
        when(userRepository.findById(REQUESTER_ID)).thenReturn(Optional.of(requester));
        when(userRepository.findById(TARGET_ID)).thenReturn(Optional.of(target));

        assertThatThrownBy(() -> userService.getUserByIdAndUser(TARGET_ID, REQUESTER_ID))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("not in the same company");
    }

    @Test
    void getUserByIdAndUser_throwsIllegalArgument_whenTargetInDifferentCompany() {
        User requester = user(REQUESTER_ID, CompanyRole.USER, company(10L));
        User target = user(TARGET_ID, CompanyRole.USER, company(20L));
        when(userRepository.findById(REQUESTER_ID)).thenReturn(Optional.of(requester));
        when(userRepository.findById(TARGET_ID)).thenReturn(Optional.of(target));

        assertThatThrownBy(() -> userService.getUserByIdAndUser(TARGET_ID, REQUESTER_ID))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("not in the same company");
    }

    @Test
    void getUserByIdAndUser_throwsIllegalArgument_whenTargetHasNoCompany() {
        User requester = user(REQUESTER_ID, CompanyRole.USER, company(10L));
        User target = user(TARGET_ID, CompanyRole.USER, null);
        when(userRepository.findById(REQUESTER_ID)).thenReturn(Optional.of(requester));
        when(userRepository.findById(TARGET_ID)).thenReturn(Optional.of(target));

        assertThatThrownBy(() -> userService.getUserByIdAndUser(TARGET_ID, REQUESTER_ID))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("not in the same company");
    }

    @Test
    void getUserByIdAndUser_throwsUserNotFound_whenTargetDoesNotExist() {
        User requester = user(REQUESTER_ID, CompanyRole.USER, company(10L));
        when(userRepository.findById(REQUESTER_ID)).thenReturn(Optional.of(requester));
        when(userRepository.findById(TARGET_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUserByIdAndUser(TARGET_ID, REQUESTER_ID))
                .isInstanceOf(UserNotFoundException.class)
                .hasMessageContaining("2");
    }

    @Test
    void getUserByIdAndUser_throwsUserNotFound_whenRequesterDoesNotExist() {
        when(userRepository.findById(REQUESTER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUserByIdAndUser(TARGET_ID, REQUESTER_ID))
                .isInstanceOf(UserNotFoundException.class)
                .hasMessageContaining("1");
    }

    @Test
    void findUser_returnsUser_whenUserExists() {
        User user = user(42L, CompanyRole.USER, null);
        when(userRepository.findById(42L)).thenReturn(Optional.of(user));

        User result = userService.findUser(42L);

        assertThat(result).isSameAs(user);
        verify(userRepository).findById(42L);
    }
}