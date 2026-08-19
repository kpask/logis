package com.example.logis.data;

import jakarta.persistence.Embeddable;

@Embeddable
public class Location {
    private double latitude;
    private double longitude;
    private String city;
    private String street;
    private String address;

    protected Location() {}

    public Location(
            double latitude,
            double longitude,
            String city,
            String street,
            String address
    ) {
        this.latitude = latitude;
        this.longitude = longitude;
        this.city = city;
        this.street = street;
        this.address = address;
    }

    public double getLatitude() {
        return latitude;
    }

    public void setLatitude(double latitude) {
        this.latitude = latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public void setLongitude(double longitude) {
        this.longitude = longitude;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getStreet() {
        return street;
    }

    public void setStreet(String street) {
        this.street = street;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }
}
