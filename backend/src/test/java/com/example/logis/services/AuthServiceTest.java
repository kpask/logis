package com.example.logis.services;

import com.example.logis.data.entities.Company;
import com.example.logis.data.entities.CompanyInvitation;
import com.example.logis.data.enums.CompanyRole;
import com.example.logis.data.enums.InvitationStatus;
import com.example.logis.data.entities.User;
import com.example.logis.dtos.requests.AddUserToCompanyRequest;
import com.example.logis.dtos.requests.CreateInvitedUserRequest;
import com.example.logis.dtos.requests.CreateUserRequest;
import com.example.logis.dtos.requests.LoginRequest;
import com.example.logis.dtos.responses.LoginResponse;
import com.example.logis.exceptions.EmailAlreadyExistsException;
import com.example.logis.exceptions.InvalidCredentialsException;
import com.example.logis.exceptions.InvalidInvitationException;
import com.example.logis.security.JwtService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {
    private static final String TOKEN = "a".repeat(36);

    @Mock
    private UserService userService;

    @Mock
    private InviteService inviteService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private CompanyService companyService;

    @InjectMocks
    private AuthService authService;

    // User/Company ids are @GeneratedValue and have no setters, so tests assign them via reflection.
    private static User user(Long id) {
        User user = new User("John", "Doe", "johndoe", "john@acme.com", "$hash$", CompanyRole.USER);
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }

    private static Company company(Long id) {
        Company company = new Company("Acme Ltd");
        ReflectionTestUtils.setField(company, "id", id);
        return company;
    }

    private static CompanyInvitation invitation(Company company) {
        // constructor defaults: PENDING status, expires in 7 days
        return new CompanyInvitation("invitee@acme.com", company, null, TOKEN);
    }

    private static CreateInvitedUserRequest invitedRequest() {
        return new CreateInvitedUserRequest("John", "Doe", "johndoe", "password123", TOKEN);
    }

    // ── login ───────────────────────────────────────────────────────────

    @Test
    void login_returnsToken_whenCredentialsAreValid() {
        User user = user(1L);
        when(userService.findUserByEmail("john@acme.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "$hash$")).thenReturn(true);
        when(jwtService.generateToken(user)).thenReturn("jwt-token");

        LoginResponse response = authService.login(new LoginRequest("john@acme.com", "password123"));

        assertThat(response.token()).isEqualTo("jwt-token");
        verify(jwtService).generateToken(user);
    }

    @Test
    void login_throwsInvalidCredentials_whenEmailIsUnknown() {
        when(userService.findUserByEmail("ghost@acme.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(new LoginRequest("ghost@acme.com", "password123")))
                .isInstanceOf(InvalidCredentialsException.class);

        // must not leak whether the email exists: no password check, no token
        verify(passwordEncoder, never()).matches(anyString(), anyString());
        verify(jwtService, never()).generateToken(any());
    }

    @Test
    void login_throwsInvalidCredentials_whenPasswordDoesNotMatch() {
        User user = user(1L);
        when(userService.findUserByEmail("john@acme.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong-pass-123", "$hash$")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(new LoginRequest("john@acme.com", "wrong-pass-123")))
                .isInstanceOf(InvalidCredentialsException.class);

        verify(jwtService, never()).generateToken(any());
    }

    // ── register (plain signup) ─────────────────────────────────────────

    @Test
    void register_normalizesInput_encodesPassword_andReturnsToken() {
        when(userService.existsByEmail("john@acme.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("$encoded$");
        User saved = user(1L);
        when(userService.saveUser(any(User.class))).thenReturn(saved);
        when(jwtService.generateToken(saved)).thenReturn("jwt-token");

        LoginResponse response = authService.register(
                new CreateUserRequest("  John  ", " Doe ", " johndoe ", "  John@Acme.COM  ", "password123"));

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userService).saveUser(captor.capture());
        User toSave = captor.getValue();
        assertThat(toSave.getName()).isEqualTo("John");
        assertThat(toSave.getLastname()).isEqualTo("Doe");
        assertThat(toSave.getUsername()).isEqualTo("johndoe");
        assertThat(toSave.getEmail()).isEqualTo("john@acme.com");
        assertThat(toSave.getPasswordHash()).isEqualTo("$encoded$");
        assertThat(response.token()).isEqualTo("jwt-token");
    }

    @Test
    void register_throwsEmailAlreadyExists_whenEmailIsTaken() {
        when(userService.existsByEmail("john@acme.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(
                new CreateUserRequest("John", "Doe", "johndoe", "John@Acme.com", "password123")))
                .isInstanceOf(EmailAlreadyExistsException.class)
                .hasMessageContaining("john@acme.com");

        verify(userService, never()).saveUser(any());
        verify(jwtService, never()).generateToken(any());
    }

    // ── register (invited signup) ───────────────────────────────────────

    @Test
    void registerInvited_createsUser_assignsCompany_andAcceptsInvitation() {
        Company company = company(10L);
        CompanyInvitation invitation = invitation(company);
        when(inviteService.findByToken(TOKEN)).thenReturn(invitation);
        when(userService.existsByEmail("invitee@acme.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("$encoded$");
        User saved = user(5L);
        when(userService.saveUser(any(User.class))).thenReturn(saved);
        when(jwtService.generateToken(saved)).thenReturn("jwt-token");

        LoginResponse response = authService.register(invitedRequest());

        verify(companyService).addUserToCompany(new AddUserToCompanyRequest(5L, false), 10L);
        assertThat(invitation.getInvitationStatus()).isEqualTo(InvitationStatus.ACCEPTED);
        assertThat(response.token()).isEqualTo("jwt-token");
    }

    @Test
    void registerInvited_throwsInvalidInvitation_whenInvitationAlreadyAccepted() {
        CompanyInvitation invitation = invitation(company(10L));
        invitation.setInvitationStatus(InvitationStatus.ACCEPTED);
        when(inviteService.findByToken(TOKEN)).thenReturn(invitation);

        assertThatThrownBy(() -> authService.register(invitedRequest()))
                .isInstanceOf(InvalidInvitationException.class)
                .hasMessageContaining("no longer valid");

        verify(userService, never()).saveUser(any());
        verify(companyService, never()).addUserToCompany(any(), any());
    }

    @Test
    void registerInvited_marksInvitationExpired_andThrows_whenInvitationIsExpired() {
        CompanyInvitation invitation = invitation(company(10L));
        invitation.setExpiresAt(LocalDateTime.now().minusDays(1));
        when(inviteService.findByToken(TOKEN)).thenReturn(invitation);

        assertThatThrownBy(() -> authService.register(invitedRequest()))
                .isInstanceOf(InvalidInvitationException.class);

        // lazy auto-expiry in getInvitationStatus() marks it EXPIRED
        assertThat(invitation.getInvitationStatus()).isEqualTo(InvitationStatus.EXPIRED);
        verify(userService, never()).saveUser(any());
    }

    @Test
    void registerInvited_throwsEmailAlreadyExists_whenEmailAlreadyRegistered() {
        CompanyInvitation invitation = invitation(company(10L));
        when(inviteService.findByToken(TOKEN)).thenReturn(invitation);
        when(userService.existsByEmail("invitee@acme.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(invitedRequest()))
                .isInstanceOf(EmailAlreadyExistsException.class);

        verify(userService, never()).saveUser(any());
        assertThat(invitation.getInvitationStatus()).isEqualTo(InvitationStatus.PENDING);
    }
}