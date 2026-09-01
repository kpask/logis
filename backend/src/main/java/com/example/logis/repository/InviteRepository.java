package com.example.logis.repository;

import com.example.logis.data.CompanyInvitation;
import com.example.logis.data.InvitationStatus;
import com.example.logis.data.Workplace;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InviteRepository extends JpaRepository<CompanyInvitation, Long> {
    Optional<CompanyInvitation> findByToken(String token);

    List<CompanyInvitation> findByEmailIgnoreCase(String email);

    List<CompanyInvitation> findByInvitedById(Long userId);

    boolean existsByEmailIgnoreCaseAndCompanyIdAndInvitationStatus(String normalizedEmail, Long id, InvitationStatus invitationStatus);
}
