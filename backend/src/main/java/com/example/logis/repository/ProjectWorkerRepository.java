package com.example.logis.repository;

import com.example.logis.data.entities.ProjectWorker;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.logis.data.entities.User;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectWorkerRepository extends JpaRepository<ProjectWorker, Long> {
    Optional<ProjectWorker> findByProject_IdAndWorker_Id(Long projectId, Long workerId);

    List<ProjectWorker> findByProject_Id(Long id);

    @Modifying
    @Query("UPDATE ProjectWorker pw SET pw.endDate = :endDate WHERE pw.worker.id = :userId AND pw.endDate IS NULL")
    int kickUserFromProjects(@Param("userId") Long userId, @Param("endDate") LocalDate endDate);

    // Distinct users with project-assignment history at the company who are no longer members.
    @Query("SELECT DISTINCT pw.worker FROM ProjectWorker pw " +
           "WHERE pw.project.workplace.company.id = :companyId " +
           "AND (pw.worker.company IS NULL OR pw.worker.company.id <> :companyId)")
    List<User> findFormerMembersByCompanyId(@Param("companyId") Long companyId);
}
