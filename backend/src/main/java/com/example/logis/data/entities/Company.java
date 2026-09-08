package com.example.logis.data.entities;

import com.example.logis.data.enums.CompanyRole;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
public class Company {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    @OneToMany(mappedBy = "company")
    private List<User> users = new ArrayList<User>();
    @OneToMany(mappedBy = "company")
    private List<Workplace> workplaces = new ArrayList<Workplace>();
    @OneToMany(mappedBy = "company")
    private final List<CompanyInvitation> invitations = new ArrayList<>();

    public Company(String name, List<User> users){
        this.name = name;
        this.users = users;
    }

    public Company(String name){
        this.name = name;
    }

    protected Company(){}

    public List<User> getManagers() {
        return users.stream().filter(user -> user.getRole() == CompanyRole.MANAGER).toList();
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
