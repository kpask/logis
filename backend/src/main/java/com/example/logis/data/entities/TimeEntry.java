package com.example.logis.data.entities;
import com.example.logis.data.enums.TimeEntryLogStatus;
import jakarta.persistence.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.Duration;
import java.time.Instant;

@Entity
public class TimeEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    @OnDelete(action = OnDeleteAction.CASCADE)
    private ProjectWorker projectWorker;
    private Instant startTime;
    private Instant endTime;
    @Enumerated(EnumType.STRING)
    private TimeEntryLogStatus status = TimeEntryLogStatus.LOGGED;

    public TimeEntry(ProjectWorker projectWorker) {
        this(projectWorker, Instant.now(), null, TimeEntryLogStatus.LOGGED);
    }

    public TimeEntry(ProjectWorker projectWorker, TimeEntryLogStatus status) {
        this(projectWorker, Instant.now(), null, status);
    }

    public TimeEntry(ProjectWorker projectWorker, Instant startTime) {
        this(projectWorker, startTime, null, TimeEntryLogStatus.LOGGED);
    }

    public TimeEntry(ProjectWorker projectWorker, Instant startTime, Instant endTime, TimeEntryLogStatus status) {
        this.projectWorker = projectWorker;
        this.startTime = startTime;
        this.endTime = endTime;
        this.status = status;
    }

    protected TimeEntry() {
    }

    public Instant getEndTime() {
        return endTime;
    }

    public void setEndTime(Instant endTime) {
        this.endTime = endTime;
    }

    public Instant getStartTime() {
        return startTime;
    }

    public void setStartTime(Instant startTime) {
        this.startTime = startTime;
    }

    public Long getId() {
        return id;
    }

    public ProjectWorker getProjectWorker() {
        return projectWorker;
    }

    public void setProjectWorker(ProjectWorker projectWorker) {
        this.projectWorker = projectWorker;
    }

    public Duration getDuration() {
        Instant end = endTime;
        if(end == null){
            end = Instant.now();
        }
        Duration duration = Duration.between(startTime, end);
        return duration.isNegative() ? Duration.ZERO : duration;
    }

    public TimeEntryLogStatus getStatus() {
        return status;
    }

    public void setStatus(TimeEntryLogStatus status) {
        this.status = status;
    }
}
