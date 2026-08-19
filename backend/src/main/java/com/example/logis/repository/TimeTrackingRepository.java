package com.example.logis.repository;

import com.example.logis.data.TimeEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TimeTrackingRepository extends JpaRepository<TimeEntry, Long> {

    // The currently running timer for a worker (endTime is null = still running)
    @Query("SELECT t FROM TimeEntry t WHERE t.projectWorker.worker.id = :workerId AND t.endTime IS NULL ORDER BY t.startTime DESC")
    Optional<TimeEntry> findActiveTimeEntry(@Param("workerId") Long workerId);

    // All time entries for a worker, newest first
    @Query("SELECT t FROM TimeEntry t WHERE t.projectWorker.worker.id = :workerId ORDER BY t.startTime DESC")
    List<TimeEntry> findAllByWorkerId(@Param("workerId") Long workerId);
}