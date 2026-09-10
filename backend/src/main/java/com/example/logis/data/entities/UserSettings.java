package com.example.logis.data.entities;

import com.example.logis.data.enums.Language;
import jakarta.persistence.*;

@Entity
public class UserSettings {
    @Id
    private Long userId;
    @OneToOne
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;
    @Enumerated(EnumType.STRING)
    Language language = Language.EN;

    public UserSettings(){}
    public UserSettings(User user){
        this.user = user;
    }

    public UserSettings(User user, Language language){
        this.language = language == null ? Language.EN : language;
        this.user = user;
    }

    public Language getLanguage() {
        return language;
    }

    public void setLanguage(Language language) {
        this.language = language;
    }

    public User getUser() {
        return user;
    }
}
