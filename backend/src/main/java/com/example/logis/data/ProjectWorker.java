package com.example.logis.data;

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
    private LocalDate startDate;
    @OneToMany
    private List<TimeEntry> timeEntries;

    public ProjectWorker(){};
    public ProjectWorker(User worker, Project project){
        this.worker = worker;
        this.project = project;
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

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }
}
