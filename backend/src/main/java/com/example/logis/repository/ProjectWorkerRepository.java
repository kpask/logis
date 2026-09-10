package com.example.logis.repository;

import com.example.logis.data.entities.ProjectWorker;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectWorkerRepository extends JpaRepository<ProjectWorker, Long> {
    Optional<ProjectWorker> findByProject_IdAndWorker_Id(Long projectId, Long workerId);

    List<ProjectWorker> findByProject_Id(Long id);

    List<ProjectWorker> findByWorker_Id(Long userId);
}
