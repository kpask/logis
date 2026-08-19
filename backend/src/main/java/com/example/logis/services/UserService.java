package com.example.logis.services;

import com.example.logis.data.User;
import com.example.logis.dtos.UserResponse;
import com.example.logis.exceptions.UserNotFoundException;
import com.example.logis.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository){
        this.userRepository = userRepository;
    }

    // ── Internal (entity) methods — used by other services ──────────────

    public User findUser(Long id){
        if(id < 1){
            throw new IllegalArgumentException("Invalid user id " + id);
        }
        return userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
    }

    public Optional<User> findUserByEmail(String email){
        return userRepository.findByEmail(email);
    }

    public boolean existsByEmail(String email){
        return userRepository.existsByEmail(email);
    }

    public User saveUser(User user){
        return userRepository.save(user);
    }

    public int countByCompany(Long companyId){
        return userRepository.countByCompanyId(companyId);
    }

    // ── API (DTO) methods — used by controllers ─────────────────────────

    public UserResponse getUser(Long id){
        User user = findUser(id);
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getName(),
                user.getLastname(),
                user.getRole(),
                user.getCompany() != null ? user.getCompany().getId() : null
        );
    }
}