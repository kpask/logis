package com.example.logis.repository;

import com.example.logis.data.ProjectWorker;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProjectWorkerRepository extends JpaRepository<ProjectWorker, Long> {
    Optional<ProjectWorker> findByProject_IdAndWorker_Id(Long projectId, Long workerId);
}