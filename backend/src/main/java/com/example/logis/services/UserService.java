package com.example.logis.services;

import com.example.logis.data.entities.User;
import com.example.logis.dtos.responses.UserResponse;
import com.example.logis.exceptions.UserNotFoundException;
import com.example.logis.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository){
        this.userRepository = userRepository;
    }

    public User findUser(Long id){
        return userRepository.findById(id).orElseThrow(() -> new UserNotFoundException(id));
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

    @Transactional
    public UserResponse getUserByIdAndUser(Long id, Long requesterId){
        User requester = findUser(requesterId);
        User target = findUser(id);
        if (requester.getCompany() == null || target.getCompany() == null
                || !requester.getCompany().getId().equals(target.getCompany().getId())) {
            throw new IllegalArgumentException("User is not in the same company as the requested user");
        }
        return toResponse(target);
    }

    public UserResponse getUserById(Long id){
        return toResponse(findUser(id));
    }

    public UserResponse toResponse(User user){
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getLastname(),
                user.getUsername(),
                user.getEmail(),
                user.getRole(),
                user.getCompany() != null ? user.getCompany().getId() : null
        );
    }
}
