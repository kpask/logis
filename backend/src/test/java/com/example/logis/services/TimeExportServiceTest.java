package com.example.logis.services;

import com.example.logis.data.entities.Company;
import com.example.logis.data.entities.User;
import com.example.logis.data.enums.CompanyRole;
import com.example.logis.data.enums.Language;
import com.example.logis.dtos.responses.TimeWorkedResponse;
import com.example.logis.exceptions.ForbiddenActionException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TimeExportServiceTest {

    @Mock
    private TimeTrackingService timeTrackingService;

    @Mock
    private UserService userService;

    @Mock
    private UserSettingsService userSettingsService;

    @InjectMocks
    private TimeExportService timeExportService;

    private static User user(Long id, CompanyRole role, Company company) {
        User user = new User("John", "Doe", "johndoe", "john" + id + "@acme.com", "password-hash", role);
        user.setCompany(company);
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }

    private static Company company(Long id) {
        Company company = new Company("Acme Ltd");
        ReflectionTestUtils.setField(company, "id", id);
        return company;
    }

    private static TimeWorkedResponse row(long userId, String date, Duration tracked, Duration worked, String... projects) {
        return new TimeWorkedResponse(userId, LocalDate.parse(date), tracked, worked, List.of(projects));
    }

    private void stubRequesterLanguage() {
        com.example.logis.data.entities.User settingsUser = new com.example.logis.data.entities.User();
        lenient().when(userSettingsService.getOrCreate(anyLong()))
                .thenReturn(new com.example.logis.data.entities.UserSettings(settingsUser, Language.EN));
    }

    // ── exportUserWorked ────────────────────────────────────────────────

    @Test
    void exportUserWorked_buildsPdf_withAllTimeFileName_whenNoMonthGiven() {
        Company company = company(10L);
        User target = user(2L, CompanyRole.USER, company);
        when(timeTrackingService.getUserTimeWorked(eq(2L), eq(2L), any(), any()))
                .thenReturn(List.of(row(2L, "2026-01-05", Duration.ofHours(8), Duration.ofHours(7).plusMinutes(30), "Warehouse")));
        when(userService.findUser(2L)).thenReturn(target);
        stubRequesterLanguage();

        TimeExportService.ExportFile file = timeExportService.exportUserWorked(2L, 2L, null, null, "pdf");

        assertThat(file.fileName()).isEqualTo("hours-johndoe-all.pdf");
        assertThat(file.mediaType()).isEqualTo("application/pdf");
        assertThat(new String(file.content(), 0, 4, StandardCharsets.US_ASCII)).isEqualTo("%PDF");
    }

    @Test
    void exportUserWorked_buildsCsv_withWorkedMinutesAndProjectsColumns() {
        Company company = company(10L);
        User target = user(2L, CompanyRole.USER, company);
        when(timeTrackingService.getUserTimeWorked(eq(2L), eq(2L), any(), any()))
                .thenReturn(List.of(row(2L, "2026-01-05", Duration.ofHours(8), Duration.ofHours(7).plusMinutes(30),
                        "Warehouse", "Logistics")));
        when(userService.findUser(2L)).thenReturn(target);
        stubRequesterLanguage();

        TimeExportService.ExportFile file = timeExportService.exportUserWorked(2L, 2L, 2026, 1, "csv");

        assertThat(file.fileName()).isEqualTo("hours-johndoe-2026-01.csv");
        assertThat(file.mediaType()).isEqualTo("text/csv;charset=UTF-8");
        String csv = new String(file.content(), StandardCharsets.UTF_8);
        assertThat(csv).contains("user_id,worker_name,date,worked_minutes,projects");
        // projects contain commas → the cell must be quoted
        assertThat(csv).contains("2,John Doe,2026-01-05,450,\"Warehouse, Logistics\"");
    }

    @Test
    void exportUserWorked_skipsSubMinuteNoiseRows() {
        Company company = company(10L);
        User target = user(2L, CompanyRole.USER, company);
        when(timeTrackingService.getUserTimeWorked(eq(2L), eq(2L), any(), any())).thenReturn(List.of(
                row(2L, "2026-01-05", Duration.ofSeconds(20), Duration.ofSeconds(20)),
                row(2L, "2026-01-06", Duration.ofHours(4), Duration.ofHours(4), "Logistics")
        ));
        when(userService.findUser(2L)).thenReturn(target);
        stubRequesterLanguage();

        TimeExportService.ExportFile file = timeExportService.exportUserWorked(2L, 2L, 2026, 1, "csv");

        String csv = new String(file.content(), StandardCharsets.UTF_8);
        assertThat(csv).doesNotContain("2026-01-05");
        assertThat(csv).contains("2026-01-06");
    }

    @Test
    void exportUserWorked_throws_whenFormatIsUnsupported() {
        Company company = company(10L);
        when(timeTrackingService.getUserTimeWorked(eq(2L), eq(2L), any(), any())).thenReturn(List.of());
        when(userService.findUser(2L)).thenReturn(user(2L, CompanyRole.USER, company));
        stubRequesterLanguage();

        assertThatThrownBy(() -> timeExportService.exportUserWorked(2L, 2L, null, null, "xlsx"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unsupported export format");
    }

    @Test
    void exportUserWorked_throws_whenOnlyMonthIsGiven() {
        assertThatThrownBy(() -> timeExportService.exportUserWorked(2L, 2L, 2026, null, "pdf"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("together");
    }

    @Test
    void exportUserWorked_throws_whenMonthIsOutOfRange() {
        assertThatThrownBy(() -> timeExportService.exportUserWorked(2L, 2L, 2026, 13, "pdf"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("between 1 and 12");
    }

    // ── exportCompanyWorked ─────────────────────────────────────────────

    @Test
    void exportCompanyWorked_rendersEveryMembersRows_forManager() {
        Company company = company(10L);
        User manager = user(1L, CompanyRole.MANAGER, company);
        company.getUsers().add(manager);
        User worker = user(2L, CompanyRole.USER, company);
        company.getUsers().add(worker);

        when(timeTrackingService.getCompanyTimeWorked(eq(1L), any(), any())).thenReturn(List.of(
                row(2L, "2026-01-05", Duration.ofHours(8), Duration.ofHours(7).plusMinutes(30), "Warehouse"),
                row(1L, "2026-01-06", Duration.ofHours(4), Duration.ofHours(4), "Logistics")
        ));
        when(userService.findUser(1L)).thenReturn(manager);
        stubRequesterLanguage();

        TimeExportService.ExportFile file = timeExportService.exportCompanyWorked(1L, 2026, 1, "csv");

        assertThat(file.fileName()).isEqualTo("hours-everyone-2026-01.csv");
        String csv = new String(file.content(), StandardCharsets.UTF_8);
        assertThat(csv).contains("1,John Doe,2026-01-06,240,Logistics");
        assertThat(csv).contains("2,John Doe,2026-01-05,450,Warehouse");
    }

    @Test
    void exportCompanyWorked_propagatesForbidden_whenRequesterIsNotManager() {
        when(timeTrackingService.getCompanyTimeWorked(eq(2L), any(), any()))
                .thenThrow(new ForbiddenActionException("Only managers can view company-wide worked time."));

        assertThatThrownBy(() -> timeExportService.exportCompanyWorked(2L, null, null, "pdf"))
                .isInstanceOf(ForbiddenActionException.class)
                .hasMessageContaining("Only managers");
    }

    @Test
    void exportCompanyWorked_buildsPdf_withPerUserSections() {
        Company company = company(10L);
        User manager = user(1L, CompanyRole.MANAGER, company);
        company.getUsers().add(manager);
        User worker = user(2L, CompanyRole.USER, company);
        company.getUsers().add(worker);

        when(timeTrackingService.getCompanyTimeWorked(eq(1L), any(), any())).thenReturn(List.of(
                row(2L, "2026-01-05", Duration.ofHours(8), Duration.ofHours(7).plusMinutes(30), "Warehouse")
        ));
        when(userService.findUser(1L)).thenReturn(manager);
        stubRequesterLanguage();

        TimeExportService.ExportFile file = timeExportService.exportCompanyWorked(1L, null, null, "pdf");

        assertThat(file.fileName()).isEqualTo("hours-everyone-all.pdf");
        assertThat(new String(file.content(), StandardCharsets.US_ASCII)).startsWith("%PDF");
    }

    // ── localization ────────────────────────────────────────────────────

    @Test
    void exportUserWorked_localizesPdf_whenRequesterUsesLithuanian() {
        Company company = company(10L);
        User target = user(2L, CompanyRole.USER, company);
        when(timeTrackingService.getUserTimeWorked(eq(2L), eq(2L), any(), any()))
                .thenReturn(List.of(row(2L, "2026-01-05", Duration.ofHours(8), Duration.ofHours(8), "Logistics")));
        when(userService.findUser(2L)).thenReturn(target);
        com.example.logis.data.entities.User settingsUser = new com.example.logis.data.entities.User();
        when(userSettingsService.getOrCreate(2L))
                .thenReturn(new com.example.logis.data.entities.UserSettings(settingsUser, Language.LT));

        TimeExportService.ExportFile file = timeExportService.exportUserWorked(2L, 2L, 2026, 1, "pdf");

        assertThat(new String(file.content(), StandardCharsets.US_ASCII)).startsWith("%PDF");
    }
}
