package com.example.logis.repository;

import com.example.logis.data.Workplace;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WorkplaceRepository extends JpaRepository<Workplace, Long> {
    List<Workplace> findByCompanyId(Long companyId);
}
