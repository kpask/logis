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


    public void inviteUser(Long userId, Long inviterId){
        User invited = findUser(userId);
        User inviter = findUser(inviterId);

    }

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
