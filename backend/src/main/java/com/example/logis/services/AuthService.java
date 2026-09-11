package com.example.logis.services;

import com.example.logis.data.entities.CompanyInvitation;
import com.example.logis.data.enums.InvitationStatus;
import com.example.logis.data.entities.User;
import com.example.logis.dtos.requests.CreateInvitedUserRequest;
import com.example.logis.dtos.requests.CreateUserRequest;
import com.example.logis.dtos.requests.AddUserToCompanyRequest;
import com.example.logis.dtos.requests.LoginRequest;
import com.example.logis.dtos.requests.UpdateUserSettingsRequest;
import com.example.logis.dtos.responses.LoginResponse;
import com.example.logis.exceptions.EmailAlreadyExistsException;
import com.example.logis.exceptions.InvalidCredentialsException;
import com.example.logis.exceptions.InvalidInvitationException;
import com.example.logis.security.JwtService;
import jakarta.transaction.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class AuthService {
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final InviteService inviteService;
    private final CompanyService companyService;
    private final UserSettingsService userSettingsService;

    public AuthService(UserService userService, InviteService inviteService, PasswordEncoder passwordEncoder, JwtService jwtService, CompanyService companyService, UserSettingsService userSettingsService) {
        this.userService = userService;
        this.inviteService = inviteService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.companyService = companyService;
        this.userSettingsService = userSettingsService;
    }

    public LoginResponse login(LoginRequest request) {
        User user = userService.findUserByEmail(request.email())
                .orElseThrow(InvalidCredentialsException::new);

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }

        String token = jwtService.generateToken(user);
        return new LoginResponse(token);
    }

    @Transactional
    public LoginResponse register(CreateUserRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userService.existsByEmail(email)) {
            throw new EmailAlreadyExistsException("User with the email " + email + " already exists.");
        }

        User user = new User(
                request.name().trim(),
                request.lastname().trim(),
                request.username().trim(),
                email,
                passwordEncoder.encode(request.password())
        );
        User savedUser = userService.saveUser(user);
        userSettingsService.updateSettingsByUser(
                savedUser.getId(),
                new UpdateUserSettingsRequest(request.language())
        );

        String token = jwtService.generateToken(savedUser);
        return new LoginResponse(token);
    }

    @Transactional
    public LoginResponse register(CreateInvitedUserRequest request) {

        CompanyInvitation invitation = inviteService.findByToken(request.token());

        String email = invitation.getEmail().trim().toLowerCase();

        if (invitation.getInvitationStatus() != InvitationStatus.PENDING) {
            throw new InvalidInvitationException("This invitation is no longer valid.");
        }

        if (invitation.getExpiresAt().isBefore(LocalDateTime.now())) {
            invitation.setInvitationStatus(InvitationStatus.EXPIRED);
            throw new InvalidInvitationException("This invitation has expired.");
        }

        if (userService.existsByEmail(email)) {
            throw new EmailAlreadyExistsException("User with the email " + email + " already exists.");
        }

        User user = new User(
                request.name().trim(),
                request.lastname().trim(),
                request.username().trim(),
                email,
                passwordEncoder.encode(request.password())
        );

        User savedUser = userService.saveUser(user);

        userSettingsService.updateSettingsByUser(
                savedUser.getId(),
                new UpdateUserSettingsRequest(request.language())
        );

        companyService.addUserToCompany(
                new AddUserToCompanyRequest(savedUser.getId(), false),
                invitation.getCompany().getId()
        );

        invitation.setInvitationStatus(InvitationStatus.ACCEPTED);

        String token = jwtService.generateToken(savedUser);

        return new LoginResponse(token);
    }
}