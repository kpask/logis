package com.example.logis.services;

import com.example.logis.data.User;
import com.example.logis.dtos.CreateUserRequest;
import com.example.logis.dtos.LoginRequest;
import com.example.logis.dtos.LoginResponse;
import com.example.logis.exceptions.EmailAlreadyExistsException;
import com.example.logis.exceptions.InvalidCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserService userService, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
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

        String token = jwtService.generateToken(savedUser);
        return new LoginResponse(token);
    }
}