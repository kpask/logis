package com.example.logis.data;
import jakarta.persistence.*;
import java.time.Duration;
import java.time.Instant;

@Entity
public class TimeEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    private ProjectWorker projectWorker;
    private Instant startTime;
    private Instant endTime;

    public TimeEntry(ProjectWorker projectWorker){
        this.projectWorker = projectWorker;
        this.startTime = Instant.now();
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

        return Duration.between(startTime, end);
    }
}
