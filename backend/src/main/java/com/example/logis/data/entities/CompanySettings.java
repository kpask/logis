package com.example.logis.data.entities;

import jakarta.persistence.*;

import java.time.LocalTime;

@Entity
public class CompanySettings {
    @Id
    private Long companyId;
    @OneToOne
    @MapsId
    @JoinColumn(name = "company_id")
    private Company company;
    private long defaultLunchLength = 30L;
    private LocalTime defaultStartTime = LocalTime.of(8, 0);
    private LocalTime defaultEndTime = LocalTime.of(17, 0);

    public CompanySettings() {}

    public CompanySettings(Company company) {
        this.company = company;
    }

    public CompanySettings(Company company, long defaultLunchLength, LocalTime defaultStartTime, LocalTime defaultEndTime) {
        this.company = company;
        this.defaultLunchLength = defaultLunchLength;
        this.defaultStartTime = defaultStartTime;
        this.defaultEndTime = defaultEndTime;
    }

    public Long getId() {
        return companyId;
    }

    public Company getCompany() {
        return company;
    }

    public void setCompany(Company company) {
        this.company = company;
    }

    public long getDefaultLunchLength() {
        return defaultLunchLength;
    }

    public void setDefaultLunchLength(long defaultLunchLength) {
        if (defaultLunchLength < 0) {
            return;
        }
        this.defaultLunchLength = defaultLunchLength;
    }

    public LocalTime getDefaultStartTime() {
        return defaultStartTime;
    }

    public void setDefaultStartTime(LocalTime defaultStartTime) {
        this.defaultStartTime = defaultStartTime;
    }

    public LocalTime getDefaultEndTime() {
        return defaultEndTime;
    }

    public void setDefaultEndTime(LocalTime defaultEndTime) {
        this.defaultEndTime = defaultEndTime;
    }
}