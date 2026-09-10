package com.example.logis.repository;

import com.example.logis.data.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByEmail(String email);
    int countByCompanyId(Long companyId);
    Optional<User> findByEmail(String email);
    List<User> findByCompanyId(Long companyId);

    boolean existsByUsername(String username);
}
