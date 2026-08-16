package com.example.logis.services;

import com.example.logis.data.User;
import com.example.logis.dtos.UserResponse;
import com.example.logis.exceptions.UserNotFoundException;
import com.example.logis.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository){
        this.userRepository = userRepository;
    }

    public UserResponse getUser(Long id){
        if(id < 1){
            throw new IllegalArgumentException("Invalid user id " + id);
        }

        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
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
