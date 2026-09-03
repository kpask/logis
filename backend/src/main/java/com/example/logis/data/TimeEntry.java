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
    private Long lunchLength = 30L;

    public TimeEntry(ProjectWorker projectWorker) {
        this(projectWorker, Instant.now(), null);
    }

    public TimeEntry(ProjectWorker projectWorker, Instant startTime) {
        this(projectWorker, startTime, null);
    }

    public TimeEntry(ProjectWorker projectWorker, Instant startTime, Instant endTime) {
        this.projectWorker = projectWorker;
        this.startTime = startTime;
        this.endTime = endTime;
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
        if (lunchLength > 0) {
            duration = duration.minus(Duration.ofMinutes(lunchLength));
        }

        return duration.isNegative() ? Duration.ZERO : duration;
    }

    public Long getLunchLength() {
        return lunchLength;
    }

    public void setLunchLength(Long lunchLength) {
        if(lunchLength == null || lunchLength <= 0) {
            this.lunchLength = 0L;
            return;
        }
        this.lunchLength = lunchLength;
    }
}
