package com.example.logis.data;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
public class Project {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String projectName;
    private LocalDate startDate;
    private LocalDate deadline;
    @ManyToOne
    @JoinColumn(name = "workplace_id")
    private Workplace workplace;
    @OneToMany(mappedBy = "project")
    private List<ProjectWorker> projectWorkers = new ArrayList<>();

    public Project(){}
    public Project(String projectName, Workplace workplace, LocalDate startDate){
        this.projectName = projectName;
        this.workplace = workplace;
        this.startDate = startDate;
    }

    public Project(String projectName, Workplace workplace, LocalDate startDate, LocalDate deadline){
        this.projectName = projectName;
        this.workplace = workplace;
        this.startDate = startDate;
        this.deadline = deadline;
    }

    public Project(String projectName, Workplace workplace){
        this.projectName = projectName;
        this.workplace = workplace;
        startDate = LocalDate.now();
    }

    public Long getId() {
        return id;
    }

    public String getProjectName() {
        return projectName;
    }

    public void setProjectName(String projectName) {
        this.projectName = projectName;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getDeadline() {
        return deadline;
    }

    public void setDeadline(LocalDate deadline) {
        this.deadline = deadline;
    }

    public Workplace getWorkplace() {
        return workplace;
    }

    public void setWorkplace(Workplace workplace) {
        this.workplace = workplace;
    }

    public List<ProjectWorker> getProjectWorkers() {
        return projectWorkers;
    }

    public void setProjectWorkers(List<ProjectWorker> projectWorkers) {
        this.projectWorkers = projectWorkers;
    }
}
