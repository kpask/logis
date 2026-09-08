package com.example.logis.util;

import com.example.logis.data.entities.Company;
import com.example.logis.data.entities.Project;
import com.example.logis.data.entities.User;
import com.example.logis.data.entities.Workplace;
import com.example.logis.data.enums.CompanyRole;

public final class AuthorizationHelper {
    private AuthorizationHelper() {}

    public static boolean isManagerOfCompany(User user, Company company) {
        return company.getId().equals(user.getCompany().getId())
                && user.getRole() != CompanyRole.USER;
    }

    public static boolean isWorkplaceOwnedByCompany(Workplace workplace, Company company) {
        return workplace.getCompany().getId().equals(company.getId());
    }

    public static boolean canModifyProject(User user, Project project) {
        return user.getRole() != CompanyRole.USER
                && project.getWorkplace().getCompany().getId()
                .equals(user.getCompany().getId());
    }

    public static boolean canModifyWorkplace(User user, Workplace workplace) {
        return user.getRole() != CompanyRole.USER
                && workplace.getCompany().getUsers().contains(user);
    }
}
