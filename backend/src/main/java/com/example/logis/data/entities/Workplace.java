package com.example.logis.data.entities;

import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
public class Workplace {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
    private String name;
    @Embedded
    private Location location;
    @ManyToOne
    private Company company;
    @OneToMany(mappedBy = "workplace", cascade = CascadeType.ALL, orphanRemoval = true)
    private final List<Project> projects = new ArrayList<>();
    private double radiusMeters = 150.0;

    public Workplace(String name, Location location, Company company){
        this.name = name;
        this.location = location;
        this.company = company;
    }

    public Workplace(String name, Location location, Company company, double radiusMeters){
        this.name = name;
        this.location = location;
        this.company = company;
        this.radiusMeters = radiusMeters;
    }

    protected Workplace() {
    }

    public Company getCompany() {
        return company;
    }

    public long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Location getLocation() {
        return location;
    }

    public void setLocation(Location location) {
        this.location = location;
    }

    public double getRadiusMeters() {
        return radiusMeters;
    }

    public void setRadiusMeters(double radiusMeters) {
        if(radiusMeters < 0){
            return;
        }
        this.radiusMeters = radiusMeters;
    }

    public List<Project> getProjects() {
        return projects;
    }
}
