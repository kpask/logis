package com.example.logis.services;

import com.example.logis.data.entities.User;
import com.example.logis.data.entities.UserSettings;
import com.example.logis.dtos.requests.UpdateUserSettingsRequest;
import com.example.logis.dtos.responses.UserSettingsResponse;
import com.example.logis.repository.UserSettingsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserSettingsService {
    private final UserSettingsRepository userSettingsRepository;
    private final UserService userService;

    public UserSettingsService(UserSettingsRepository userSettingsRepository, UserService userService) {
        this.userSettingsRepository = userSettingsRepository;
        this.userService = userService;
    }

    @Transactional
    public UserSettings getOrCreate(Long userId) {
        User user = userService.findUser(userId);
        return userSettingsRepository.findById(userId)
                .orElseGet(() -> userSettingsRepository.save(new UserSettings(user)));
    }

    @Transactional
    public UserSettingsResponse getSettingsByUser(Long userId) {
        return toResponse(getOrCreate(userId));
    }

    @Transactional
    public UserSettingsResponse updateSettingsByUser(Long userId, UpdateUserSettingsRequest request) {
        UserSettings settings = getOrCreate(userId);
        settings.setLanguage(request.language());
        return toResponse(userSettingsRepository.save(settings));
    }

    public UserSettingsResponse toResponse(UserSettings settings) {
        return new UserSettingsResponse(settings.getLanguage());
    }
}
