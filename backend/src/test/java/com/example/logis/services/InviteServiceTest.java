package com.example.logis.services;

import com.example.logis.data.Company;
import com.example.logis.data.CompanyInvitation;
import com.example.logis.data.enums.CompanyRole;
import com.example.logis.data.enums.InvitationStatus;
import com.example.logis.data.User;
import com.example.logis.dtos.AddUserToCompanyRequest;
import com.example.logis.dtos.InvitationResponse;
import com.example.logis.exceptions.ForbiddenActionException;
import com.example.logis.exceptions.InvitationNotFoundException;
import com.example.logis.repository.InviteRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InviteServiceTest {
    private static final String TOKEN = "a".repeat(36);

    @Mock
    private InviteRepository inviteRepository;

    @Mock
    private UserService userService;

    @Mock
    private CompanyService companyService;

    @InjectMocks
    private InviteService inviteService;

    // User/Company ids are @GeneratedValue and have no setters, so tests assign them via reflection.
    private static User user(Long id, CompanyRole role, Company company, String email) {
        User user = new User("John", "Doe", "johndoe", email, "password-hash", role);
        user.setCompany(company);
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }

    private static Company company(Long id) {
        Company company = new Company("Acme Ltd");
        ReflectionTestUtils.setField(company, "id", id);
        return company;
    }

    private static CompanyInvitation invitation(Company company, User inviter) {
        // constructor defaults: PENDING status, expires in 7 days
        return new CompanyInvitation("invitee@acme.com", company, inviter, TOKEN);
    }

    // ── createInvitation ────────────────────────────────────────────────

    @Test
    void createInvitation_throwsForbidden_whenInviterHasNoCompany() {
        when(userService.findUser(1L)).thenReturn(user(1L, CompanyRole.MANAGER, null, "john@acme.com"));

        assertThatThrownBy(() -> inviteService.createInvitation(1L, "invitee@acme.com"))
                .isInstanceOf(ForbiddenActionException.class)
                .hasMessageContaining("not part of a company");

        verifyNoInteractions(inviteRepository);
    }

    @Test
    void createInvitation_throwsForbidden_whenInviterIsNotManager() {
        when(userService.findUser(1L)).thenReturn(user(1L, CompanyRole.USER, company(10L), "john@acme.com"));

        assertThatThrownBy(() -> inviteService.createInvitation(1L, "invitee@acme.com"))
                .isInstanceOf(ForbiddenActionException.class)
                .hasMessageContaining("non-manager");

        verifyNoInteractions(inviteRepository);
    }

    @Test
    void createInvitation_throwsIllegalArgument_whenInviteeIsAlreadyMember() {
        User inviter = user(1L, CompanyRole.MANAGER, company(10L), "john@acme.com");
        User existingMember = user(2L, CompanyRole.USER, inviter.getCompany(), "invitee@acme.com");
        when(userService.findUser(1L)).thenReturn(inviter);
        when(userService.findUserByEmail("invitee@acme.com")).thenReturn(Optional.of(existingMember));

        assertThatThrownBy(() -> inviteService.createInvitation(1L, "  Invitee@ACME.com  "))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already a member");

        verifyNoInteractions(inviteRepository);
    }

    @Test
    void createInvitation_throwsIllegalArgument_whenPendingInviteAlreadyExists() {
        User inviter = user(1L, CompanyRole.MANAGER, company(10L), "john@acme.com");
        when(userService.findUser(1L)).thenReturn(inviter);
        when(userService.findUserByEmail("invitee@acme.com")).thenReturn(Optional.empty());
        when(inviteRepository.existsByEmailIgnoreCaseAndCompanyIdAndInvitationStatus(
                "invitee@acme.com", 10L, InvitationStatus.PENDING)).thenReturn(true);

        assertThatThrownBy(() -> inviteService.createInvitation(1L, "invitee@acme.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("pending invitation");

        verify(inviteRepository, never()).save(any());
    }

    @Test
    void createInvitation_savesInvitation_withNormalizedEmail_andReturnsResponse() {
        User inviter = user(1L, CompanyRole.MANAGER, company(10L), "john@acme.com");
        when(userService.findUser(1L)).thenReturn(inviter);
        when(userService.findUserByEmail("invitee@acme.com")).thenReturn(Optional.empty());
        when(inviteRepository.existsByEmailIgnoreCaseAndCompanyIdAndInvitationStatus(
                "invitee@acme.com", 10L, InvitationStatus.PENDING)).thenReturn(false);
        when(inviteRepository.save(any(CompanyInvitation.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userService.existsByEmail("invitee@acme.com")).thenReturn(false);

        InvitationResponse response = inviteService.createInvitation(1L, "  Invitee@ACME.com  ");

        ArgumentCaptor<CompanyInvitation> captor = ArgumentCaptor.forClass(CompanyInvitation.class);
        verify(inviteRepository).save(captor.capture());
        CompanyInvitation saved = captor.getValue();
        assertThat(saved.getEmail()).isEqualTo("invitee@acme.com");
        assertThat(saved.getToken()).isNotBlank();
        assertThat(saved.getCompany()).isSameAs(inviter.getCompany());
        assertThat(ReflectionTestUtils.getField(saved, "invitedBy")).isSameAs(inviter);
        assertThat(saved.getExpiresAt()).isAfter(LocalDateTime.now());

        assertThat(response.companyName()).isEqualTo("Acme Ltd");
        assertThat(response.email()).isEqualTo("invitee@acme.com");
        assertThat(response.status()).isEqualTo(InvitationStatus.PENDING);
        assertThat(response.userExists()).isFalse();
        assertThat(response.token()).isEqualTo(saved.getToken());
    }

    // ── acceptInvite ────────────────────────────────────────────────────

    @Test
    void acceptInvite_throwsIllegalState_whenInvitationIsNotPending() {
        CompanyInvitation invitation = invitation(company(10L), null);
        invitation.setInvitationStatus(InvitationStatus.ACCEPTED);
        when(userService.findUser(5L)).thenReturn(user(5L, CompanyRole.USER, null, "john@acme.com"));
        when(inviteRepository.findByToken(TOKEN)).thenReturn(Optional.of(invitation));

        assertThatThrownBy(() -> inviteService.acceptInvite(TOKEN, 5L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("no longer valid");

        verify(companyService, never()).addUserToCompany(any(), any());
    }

    @Test
    void acceptInvite_marksInvitationExpired_andThrows_whenInvitationIsExpired() {
        CompanyInvitation invitation = invitation(company(10L), null);
        invitation.setExpiresAt(LocalDateTime.now().minusDays(1));
        when(userService.findUser(5L)).thenReturn(user(5L, CompanyRole.USER, null, "john@acme.com"));
        when(inviteRepository.findByToken(TOKEN)).thenReturn(Optional.of(invitation));

        assertThatThrownBy(() -> inviteService.acceptInvite(TOKEN, 5L))
                .isInstanceOf(IllegalStateException.class);

        // lazy auto-expiry in getInvitationStatus() marks it EXPIRED
        assertThat(invitation.getInvitationStatus()).isEqualTo(InvitationStatus.EXPIRED);
        verify(companyService, never()).addUserToCompany(any(), any());
    }

    @Test
    void acceptInvite_throwsForbidden_whenAccepterAlreadyBelongsToACompany() {
        CompanyInvitation invitation = invitation(company(10L), null);
        when(userService.findUser(5L)).thenReturn(user(5L, CompanyRole.USER, company(20L), "john@acme.com"));
        when(inviteRepository.findByToken(TOKEN)).thenReturn(Optional.of(invitation));

        assertThatThrownBy(() -> inviteService.acceptInvite(TOKEN, 5L))
                .isInstanceOf(ForbiddenActionException.class)
                .hasMessageContaining("already part of a company");

        assertThat(invitation.getInvitationStatus()).isEqualTo(InvitationStatus.PENDING);
    }

    @Test
    void acceptInvite_throwsForbidden_whenInvitationWasSentToAnotherEmail() {
        CompanyInvitation invitation = invitation(company(10L), null); // invitee@acme.com
        when(userService.findUser(5L)).thenReturn(user(5L, CompanyRole.USER, null, "john@acme.com"));
        when(inviteRepository.findByToken(TOKEN)).thenReturn(Optional.of(invitation));

        assertThatThrownBy(() -> inviteService.acceptInvite(TOKEN, 5L))
                .isInstanceOf(ForbiddenActionException.class)
                .hasMessageContaining("another email address");

        verify(companyService, never()).addUserToCompany(any(), any());
    }

    @Test
    void acceptInvite_addsUserToCompany_andMarksInvitationAccepted() {
        Company company = company(10L);
        CompanyInvitation invitation = new CompanyInvitation("john@acme.com", company, null, TOKEN);
        User accepter = user(5L, CompanyRole.USER, null, "john@acme.com");
        when(userService.findUser(5L)).thenReturn(accepter);
        when(inviteRepository.findByToken(TOKEN)).thenReturn(Optional.of(invitation));

        inviteService.acceptInvite(TOKEN, 5L);

        verify(companyService).addUserToCompany(new AddUserToCompanyRequest(5L, false), 10L);
        assertThat(invitation.getInvitationStatus()).isEqualTo(InvitationStatus.ACCEPTED);
    }

    // ── lookups ─────────────────────────────────────────────────────────

    @Test
    void findByToken_throwsInvitationNotFound_whenTokenIsUnknown() {
        when(inviteRepository.findByToken("unknown-token")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> inviteService.findByToken("unknown-token"))
                .isInstanceOf(InvitationNotFoundException.class);
    }

    @Test
    void getUserInvites_returnsInvitations_forTheUsersEmail() {
        User user = user(5L, CompanyRole.USER, null, "john@acme.com");
        List<CompanyInvitation> invites = List.of(invitation(company(10L), null));
        when(userService.findUser(5L)).thenReturn(user);
        when(inviteRepository.findByEmailIgnoreCase("john@acme.com")).thenReturn(invites);

        assertThat(inviteService.getUserInvites(5L)).isSameAs(invites);
    }
}