package com.example.logis.data;

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
    @ManyToMany
    private List<User> managers = new ArrayList<>();

    public Workplace(String name, Location location, Company company){
        this.name = name;
        this.location = location;
        this.company = company;
    }

    public Workplace(String name, Location location, Company company, List<User> managers){
        this.name = name;
        this.location = location;
        this.company = company;
        this.managers = managers;
    }

    protected Workplace() {
    }

    public Company getCompany() {
        return company;
    }

    public List<User> getManagers() {
        return managers;
    }

    public void setManagers(List<User> managers) {
        this.managers = managers;
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
}
