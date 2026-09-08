package com.example.logis.data.enums;

public enum TimeEntryLogStatus {
    LOGGED,          // normal timer start/stop by the worker
    LOGGED_OUTSIDE,  // timer started outside the workplace location/geofence
    MANUAL_ENTRY,    // created by hand by a manager (createTimeEntryForProject)
    EDITED           // times changed after logging (updateTimeEntry)
}
