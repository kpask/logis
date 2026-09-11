package com.example.logis.services;

import com.example.logis.data.entities.User;
import com.example.logis.dtos.requests.UpdateUserRequest;
import com.example.logis.dtos.responses.UserResponse;
import com.example.logis.exceptions.UserNotFoundException;
import com.example.logis.exceptions.UsernameAlreadyExistsException;
import com.example.logis.repository.UserRepository;
import com.example.logis.util.AuthorizationHelper;

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
        if (!requester.getId().equals(target.getId()) && !AuthorizationHelper.areUsersPartOfSameCompany(requester, target)) {
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

    @Transactional
    public UserResponse updateUser(Long requesterId, UpdateUserRequest request) {
        User user = findUser(requesterId);
        user.setName(request.name() != null ? request.name() : user.getName());

        if(request.username() != null && userRepository.existsByUsername(request.username())){
            throw new UsernameAlreadyExistsException(request.username());
        }

        user.setUsername(request.username() != null ? request.username() : user.getUsername());
        return toResponse(userRepository.save(user));
    }
}
