package com.example.logis.data.entities;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.util.List;

@Entity
public class ProjectWorker {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    private User worker;
    @ManyToOne
    private Project project;
    private LocalDate assignedAt;
    private LocalDate endDate;
    @OneToMany(mappedBy = "projectWorker", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TimeEntry> timeEntries;

    public ProjectWorker(){};
    public ProjectWorker(User worker, Project project){
        this.worker = worker;
        this.project = project;
        this.assignedAt = LocalDate.now();
    }

    public Long getId() {
        return id;
    }

    public User getWorker() {
        return worker;
    }

    public void setWorker(User worker) {
        this.worker = worker;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public LocalDate getAssignedAt() {
        return assignedAt;
    }

    public void setAssignedAt(LocalDate assignedAt) {
        this.assignedAt = assignedAt;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public List<TimeEntry> getTimeEntries() {
        return timeEntries;
    }
}
