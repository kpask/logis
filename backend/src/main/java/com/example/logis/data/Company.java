package com.example.logis.data;

import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    @ManyToMany
    private List<User> managers = new ArrayList<User>();
    @OneToMany(mappedBy = "company")
    private List<User> users = new ArrayList<User>();
    @OneToMany(mappedBy = "company")
    private List<Workplace> workplaces = new ArrayList<Workplace>();
    @OneToMany
    private final List<CompanyInvitation> invitations = new ArrayList<>();


    public Company(String name, List<User> managers, List<User> users){
        this.name = name;
        this.managers = managers;
        this.users = users;
    }

    public Company(String name, User manager){
        this.name = name;
        managers.add(manager);
    }

    protected Company(){}

    public List<User> getManagers() {
        return managers;
    }

    public void setManagers(List<User> managers) {
        this.managers = managers;
    }

    public Long getId() {
        return id;
    }
    public String getName(){
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
    public List<User> getUsers() {
        return users;
    }

    public void setUsers(List<User> users) {
        this.users = users;
    }

    public List<Workplace> getWorkplaces() {
        return workplaces;
    }

    public void setWorkplaces(List<Workplace> workplaces) {
        this.workplaces = workplaces;
    }

    public List<CompanyInvitation> getInvitations() {
        return invitations;
    }
}
