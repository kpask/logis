package com.example.logis.data;

import com.example.logis.data.enums.InvitationStatus;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
public class CompanyInvitation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String email;

    @ManyToOne
    private Company company;

    @ManyToOne
    private User invitedBy;

    private String token;

    private LocalDateTime expiresAt;

    @Enumerated(EnumType.STRING)
    private InvitationStatus invitationStatus = InvitationStatus.PENDING;

    public CompanyInvitation(String email, Company company, User invitedBy, String token) {
        this.email = email;
        this.company = company;
        this.invitedBy = invitedBy;
        this.token = token;
        this.expiresAt = LocalDateTime.now().plusDays(7);
    }

    protected CompanyInvitation() {}

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Company getCompany() {
        return company;
    }

    public void setCompany(Company company) {
        this.company = company;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public InvitationStatus getInvitationStatus() {
        if(expiresAt.isBefore(LocalDateTime.now()) && invitationStatus.equals(InvitationStatus.PENDING)){
            invitationStatus = InvitationStatus.EXPIRED;
        }
        return invitationStatus;
    }

    public void setInvitationStatus(InvitationStatus invitationStatus) {
        this.invitationStatus = invitationStatus;
    }

    public String getToken() {
        return token;
    }
}