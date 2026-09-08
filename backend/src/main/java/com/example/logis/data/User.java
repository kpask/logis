package com.example.logis.data;

import com.example.logis.data.enums.CompanyRole;
import jakarta.persistence.*;

@Entity
@Table(
        name = "users",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = "email")
        }
)
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Enumerated(EnumType.STRING)
    private CompanyRole companyRole = CompanyRole.USER;
    @ManyToOne
    private Company company;
    @Column(nullable = false, unique = true)
    private String email;
    private String username;
    private String name;
    private String lastname;
    private String passwordHash;

    public User(){}
    public User(String name, String lastname, String username, String email, String passwordHash, CompanyRole companyRole){
        this.name = name;
        this.lastname = lastname;
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
        this.companyRole = companyRole;
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

    public CompanyRole getRole() {
        if(companyRole == null){
            companyRole = CompanyRole.USER;
        }
        return companyRole;
    }

    public void setRole(CompanyRole companyRole) {
        this.companyRole = companyRole;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email == null ? null : email.trim().toLowerCase();
    }

    @PrePersist
    @PreUpdate
    private void normalizeEmail() {
        if (email != null) {
            email = email.trim().toLowerCase();
        }
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
        if (!(o instanceof User other)) {
            return false;
        }

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
