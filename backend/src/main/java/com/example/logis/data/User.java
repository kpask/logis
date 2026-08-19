package com.example.logis.data;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Enumerated(EnumType.STRING)
    private GlobalRole globalRole = GlobalRole.USER;
    @ManyToOne
    private Company company;

    private String email;
    private String username;
    private String name;
    private String lastname;
    private String passwordHash;

    public User(){}
    public User(String name, String lastname, String username, String email, String passwordHash, GlobalRole globalRole){
        this.name = name;
        this.lastname = lastname;
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
        this.globalRole = globalRole;
    }

    public User(String name, String lastname, String username, String email, String passwordHash, Company company){
        this.name = name;
        this.lastname = lastname;
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
        this.company = company;
    }

    public User(String name, String lastname, String username, String email, String passwordHash){
        this.name = name;
        this.lastname = lastname;
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
    }

    public Long getId() {
        return id;
    }

    public GlobalRole getRole() {
        return globalRole;
    }

    public void setRole(GlobalRole globalRole) {
        this.globalRole = globalRole;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getLastname() {
        return lastname;
    }

    public void setLastname(String lastname) {
        this.lastname = lastname;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public Company getCompany() {
        return company;
    }

    public void setCompany(Company company) {
        this.company = company;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof User)) {
            return false;
        }

        User other = (User) o;
        if (id == null) {
            return false;
        }

        return id.equals(other.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
