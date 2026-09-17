package com.example.logis.util;

import com.example.logis.data.entities.Company;
import com.example.logis.data.entities.Project;
import com.example.logis.data.entities.User;
import com.example.logis.data.entities.Workplace;
import com.example.logis.data.enums.CompanyRole;

public final class AuthorizationHelper {
    private AuthorizationHelper() {}

    public static boolean isManagerOrHigherOfCompany(User user, Company company) {
        if(user.getCompany() == null || user.getRole().equals(CompanyRole.USER)){
            return false;
        }
        return company.getId().equals(user.getCompany().getId());
    }

    public static boolean isManagerOfCompany(User user, Company company) {
        if(user.getCompany() == null || user.getRole().equals(CompanyRole.USER)){
            return false;
        }
        return company.getId().equals(user.getCompany().getId())
                && user.getRole() == CompanyRole.MANAGER;
    }

    public static boolean isWorkplaceOwnedByCompany(Workplace workplace, Company company) {
        if(workplace == null || company == null){
            return false;
        }
        return workplace.getCompany().getId().equals(company.getId());
    }

    public static boolean isProjectOwnedByCompany(Project project, Company company) {
        if(project == null || company == null){
            return false;
        }
        return isWorkplaceOwnedByCompany(project.getWorkplace(), company);
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

    public static boolean areUsersPartOfSameCompany(User user1, User user2) {
        return user1.getCompany() != null && user2.getCompany() != null && user1.getCompany().getId().equals(user2.getCompany().getId());
    }

    public static boolean isUserOwner(User user) {
        return user.getRole().equals(CompanyRole.OWNER) && user.getCompany() != null;
    }


    public static boolean isUserPartOfCompany(User user, Company company){
        if (user.getCompany() == null) {
            return false;
        }
        return user.getCompany().getId().equals(company.getId());
    }
}
