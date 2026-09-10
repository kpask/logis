package com.example.logis.data.entities;

import com.example.logis.data.enums.ProjectStatus;
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
    private Workplace workplace;
    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProjectWorker> projectWorkers = new ArrayList<>();
    @Enumerated(EnumType.STRING)
    private ProjectStatus projectStatus = ProjectStatus.ON_HOLD;

    public Project(){}
    public Project(String projectName, Workplace workplace, LocalDate startDate){
        this.projectName = projectName;
        this.workplace = workplace;
        this.startDate = startDate == null ? LocalDate.now() : startDate;
        projectStatus = ProjectStatus.ACTIVE;
    }

    public Project(String projectName, Workplace workplace, LocalDate startDate, LocalDate deadline){
        this.projectName = projectName;
        this.workplace = workplace;
        this.startDate = startDate == null ? LocalDate.now() : startDate;
        this.deadline = deadline;
        projectStatus = deadline != null && deadline.isAfter(LocalDate.now()) ? ProjectStatus.ACTIVE : ProjectStatus.PENDING;
    }

    public Project(String projectName, Workplace workplace){
        this.projectName = projectName;
        this.workplace = workplace;
        startDate = LocalDate.now();
        projectStatus = ProjectStatus.ACTIVE;
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

    public void setId(Long id) {
        this.id = id;
    }

    public ProjectStatus getProjectStatus() {
        return projectStatus;
    }

    public void setProjectStatus(ProjectStatus projectStatus) {
        this.projectStatus = projectStatus;
    }
}
