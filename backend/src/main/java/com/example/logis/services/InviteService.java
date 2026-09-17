package com.example.logis.services;

import com.example.logis.data.entities.CompanyInvitation;
import com.example.logis.data.entities.User;
import com.example.logis.data.enums.InvitationStatus;
import com.example.logis.exceptions.InvalidInvitationException;
import com.example.logis.dtos.requests.AddUserToCompanyRequest;
import com.example.logis.dtos.responses.InvitationResponse;
import com.example.logis.exceptions.ForbiddenActionException;
import com.example.logis.exceptions.InvitationNotFoundException;
import com.example.logis.repository.InviteRepository;
import com.example.logis.util.AuthorizationHelper;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class InviteService {
    private final InviteRepository inviteRepository;
    private final UserService userService;
    private final CompanyService companyService;

    public InviteService(InviteRepository inviteRepository, UserService userService, CompanyService companyService){
        this.inviteRepository = inviteRepository;
        this.userService = userService;
        this.companyService = companyService;
    }

    @Transactional
    public InvitationResponse createInvitation(Long inviterId, String email) {
        User inviter = userService.findUser(inviterId);
        if (!AuthorizationHelper.isUserOwner(inviter)) {
            throw new ForbiddenActionException("You cannot invite users because you are not an owner of a company.");
        }

        String normalizedEmail = email.trim().toLowerCase();
        User existingUser = userService.findUserByEmail(normalizedEmail).orElse(null);
        if (existingUser != null && AuthorizationHelper.areUsersPartOfSameCompany(inviter, existingUser)) {
            throw new IllegalArgumentException("This user is already a member of your company.");
        }

        if (inviteRepository.existsByEmailIgnoreCaseAndCompanyIdAndInvitationStatus(
                normalizedEmail,
                inviter.getCompany().getId(),
                InvitationStatus.PENDING
        )) {
            throw new IllegalArgumentException("There is already a pending invitation for this email.");
        }

        String token = UUID.randomUUID().toString();
        CompanyInvitation invitation = new CompanyInvitation(
                normalizedEmail,
                inviter.getCompany(),
                inviter,
                token
        );

        invitation.setExpiresAt(LocalDateTime.now().plusDays(7));
        inviteRepository.save(invitation);

        // TODO: send email containing:
        // http://localhost:5173/invitations/{token}

        return toResponse(invitation);
    }

    @Transactional
    public void acceptInvite(String token, Long accepterId){
        User accepter = userService.findUser(accepterId);
        CompanyInvitation invitation = findByToken(token);
        if(!invitation.getInvitationStatus().equals(InvitationStatus.PENDING)){
            throw new InvalidInvitationException("Invitation is no longer valid");
        }
        if(invitation.getExpiresAt().isBefore(LocalDateTime.now())){
            invitation.setInvitationStatus(InvitationStatus.EXPIRED);
            throw new InvalidInvitationException("Invitation has expired");
        }
        if(accepter.getCompany() != null){
            throw new ForbiddenActionException("You are already part of a company and cannot accept this invitation.");
        }
        if(!invitation.getEmail().equalsIgnoreCase(accepter.getEmail())){
            throw new ForbiddenActionException("This invitation was sent to another email address.");
        }
        companyService.addUserToCompany(new AddUserToCompanyRequest(accepter.getId(), false), invitation.getCompany().getId());
        invitation.setInvitationStatus(InvitationStatus.ACCEPTED);
    }

    public List<CompanyInvitation> getUserInvites(Long userId){
        User user = userService.findUser(userId);
        return inviteRepository.findByEmailIgnoreCase(user.getEmail());
    }

    public List<CompanyInvitation> getInvitesSentBy(Long userId){
        return inviteRepository.findByInvitedById(userId);
    }

    public CompanyInvitation findByToken(String token){
        return inviteRepository.findByToken(token).orElseThrow(
                () -> new InvitationNotFoundException("Invitation with the provided token was not found."));
    }

    @Transactional
    public InvitationResponse getInvitation(String token) {
        CompanyInvitation invitation = findByToken(token);
        return toResponse(invitation);
    }

    public InvitationResponse toResponse(CompanyInvitation invitation) {
        boolean exists = userService.existsByEmail(invitation.getEmail());
        return new InvitationResponse(
                invitation.getCompany().getName(),
                invitation.getEmail(),
                invitation.getInvitationStatus(),
                invitation.getExpiresAt(),
                exists,
                invitation.getToken()
        );
    }
}
