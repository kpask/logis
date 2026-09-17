package com.example.logis.services;

import com.example.logis.data.entities.User;
import com.example.logis.data.enums.Language;
import com.example.logis.dtos.responses.TimeWorkedResponse;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class TimeExportService {
    public record ExportFile(String fileName, String mediaType, byte[] content) {}
    public static final String FORMAT_PDF = "pdf";
    public static final String FORMAT_CSV = "csv";
    static final Duration MIN_WORKED = Duration.ofMinutes(1);
    private static final DateTimeFormatter FILE_MONTH = DateTimeFormatter.ofPattern("yyyy-MM");

    // DejaVu Sans has full Baltic coverage (ą, č, ę, ė, į, š, ų, ū, ž, …);
    // the base-14 PDF fonts can't be embedded and don't cover Lithuanian.
    private static final String FONT_REGULAR = "fonts/DejaVuSans.ttf";
    private static final String FONT_BOLD = "fonts/DejaVuSans-Bold.ttf";

    private record Labels(String title, String date, String worked, String projects, String total,
                          String allEmployees, String allTime, Locale locale) {
        static Labels forLanguage(Language language) {
            if (language == Language.LT) {
                return new Labels("Darbo valandų ataskaita", "Data", "Dirbta", "Projektai", "Iš viso",
                        "Visi darbuotojai", "Visas užfiksuotas laikas",
                        Locale.forLanguageTag("lt-LT"));
            }
            return new Labels("Work hours report", "Date", "Worked", "Projects", "Total",
                    "All employees", "All recorded time", Locale.UK);
        }
    }

    private final TimeTrackingService timeTrackingService;
    private final UserService userService;
    private final UserSettingsService userSettingsService;

    public TimeExportService(TimeTrackingService timeTrackingService, UserService userService,
                             UserSettingsService userSettingsService) {
        this.timeTrackingService = timeTrackingService;
        this.userService = userService;
        this.userSettingsService = userSettingsService;
    }

    public ExportFile exportUserWorked(long targetUserId, long requesterId, Integer year, Integer month, String format) {
        Instant[] range = resolveRange(year, month);
        List<TimeWorkedResponse> rows = timeTrackingService.getUserTimeWorked(targetUserId, requesterId, range[0], range[1]);

        User target = userService.findUser(targetUserId);
        String scopeName = displayName(target);
        String companyName = target.getCompany() != null ? target.getCompany().getName() : null;

        return render(rows, Map.of(target.getId(), scopeName), scopeName, companyName, year, month,
                labels(requesterId), format,
                fileBaseName("hours", target.getUsername() != null ? target.getUsername() : "user-" + target.getId(), year, month));
    }

    public ExportFile exportCompanyWorked(long requesterId, Integer year, Integer month, String format) {
        Instant[] range = resolveRange(year, month);
        List<TimeWorkedResponse> rows = timeTrackingService.getCompanyTimeWorked(requesterId, range[0], range[1]);

        User requester = userService.findUser(requesterId);
        String companyName = requester.getCompany() != null ? requester.getCompany().getName() : null;

        Labels labels = labels(requesterId);
        String scopeName = labels.allEmployees();

        Map<Long, String> names = requester.getCompany() == null ? Map.of() :
                requester.getCompany().getUsers().stream()
                        .collect(Collectors.toMap(User::getId, TimeExportService::displayName, (existing, replacement) -> existing));

        return render(rows, names, scopeName, companyName, year, month, labels, format,
                fileBaseName("hours", "everyone", year, month));
    }

    private Labels labels(long requesterId) {
        return Labels.forLanguage(userSettingsService.getOrCreate(requesterId).getLanguage());
    }

    private static Instant[] resolveRange(Integer year, Integer month) {
        if (year == null && month == null) {
            return new Instant[]{null, null};
        }
        if (year == null || month == null) {
            throw new IllegalArgumentException("Year and month must be provided together");
        }
        if (month < 1 || month > 12) {
            throw new IllegalArgumentException("Month must be between 1 and 12");
        }
        YearMonth ym = YearMonth.of(year, month);
        ZoneId zone = TimeTrackingService.WORK_ZONE;
        return new Instant[]{
                ym.atDay(1).atStartOfDay(zone).toInstant(),
                ym.atEndOfMonth().atTime(LocalDateTime.MAX.toLocalTime()).atZone(zone).toInstant()
        };
    }

    private ExportFile render(List<TimeWorkedResponse> rows, Map<Long, String> names, String scopeName,
                              String companyName, Integer year, Integer month, Labels labels,
                              String format, String baseName) {
        String normalized = format == null ? FORMAT_PDF : format.trim().toLowerCase();
        return switch (normalized) {
            case FORMAT_PDF -> new ExportFile(baseName + ".pdf", "application/pdf",
                    buildPdf(rows, names, scopeName, companyName, year, month, labels));
            case FORMAT_CSV -> new ExportFile(baseName + ".csv", "text/csv;charset=UTF-8",
                    buildCsv(rows, names));
            default -> throw new IllegalArgumentException("Unsupported export format: " + format);
        };
    }

    /** Per-day rows for one user, oldest first, sub-minute noise filtered out. */
    private static List<TimeWorkedResponse> rowsForUser(List<TimeWorkedResponse> rows, long userId) {
        return rows.stream()
                .filter(r -> r.userId().equals(userId))
                .filter(r -> toSeconds(r.worked()) >= MIN_WORKED.getSeconds())
                .sorted(Comparator.comparing(TimeWorkedResponse::date))
                .toList();
    }

    private static String displayName(User user) {
        String name = (user.getName() != null ? user.getName() : "") + " " +
                (user.getLastname() != null ? user.getLastname() : "");
        return name.isBlank() ? "User " + user.getId() : name.trim();
    }

    private static String fileBaseName(String prefix, String scope, Integer year, Integer month) {
        String period = year != null && month != null ? "-" + YearMonth.of(year, month).format(FILE_MONTH) : "-all";
        return prefix + "-" + scope + period;
    }

    private static String formatDuration(Duration duration) {
        if (duration == null || duration.isNegative()) duration = Duration.ZERO;
        long hours = duration.toHours();
        int minutes = duration.toMinutesPart();
        return hours + ":" + String.format("%02d", minutes);
    }

    // ── CSV ─────────────────────────────────────────────────────────

    private byte[] buildCsv(List<TimeWorkedResponse> rows, Map<Long, String> names) {
        StringBuilder sb = new StringBuilder();
        sb.append('\uFEFF'); // BOM so Excel opens UTF-8 names correctly
        sb.append("user_id,worker_name,date,worked_minutes,projects\n");
        for (long userId : sortedUserIds(rows, names)) {
            for (TimeWorkedResponse row : rowsForUser(rows, userId)) {
                sb.append(csvCell(String.valueOf(userId))).append(',')
                        .append(csvCell(names.getOrDefault(userId, "User " + userId))).append(',')
                        .append(row.date()).append(',')
                        .append(Duration.ZERO.plusSeconds(row.worked() == null ? 0 : toSeconds(row.worked())).toMinutes()).append(',')
                        .append(csvCell(String.join(", ", row.projects() == null ? List.of() : row.projects())))
                        .append('\n');
            }
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private static long toSeconds(Duration duration) {
        return duration == null ? 0 : duration.getSeconds();
    }

    private static String csvCell(String value) {
        if (value == null) return "";

        // Excel/Sheets treat a leading =, +, -, @ as a formula — escape it
        if (value.startsWith("=") || value.startsWith("+") || value.startsWith("-") || value.startsWith("@")) {
            value = "'" + value;
        }

        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return '"' + value.replace("\"", "\"\"") + '"';
        }
        return value;
    }

    // ── PDF ─────────────────────────────────────────────────────────

    // BaseFont.createFont caches by (path, encoding, embedded) internally,
    // so repeated calls with the same args are cheap — no need to cache ourselves.
    private static BaseFont regularFont() throws Exception {
        return BaseFont.createFont(FONT_REGULAR, BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
    }

    private static BaseFont boldFont() throws Exception {
        return BaseFont.createFont(FONT_BOLD, BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
    }

    private byte[] buildPdf(List<TimeWorkedResponse> rows, Map<Long, String> names, String scopeName,
                            String companyName, Integer year, Integer month, Labels labels) {
        Document document = new Document(PageSize.A4, 36, 36, 40, 40);

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter.getInstance(document, baos);
            document.open();

            BaseFont base = regularFont();
            BaseFont bold = boldFont();

            Font titleFont = new Font(bold, 16);
            Font metaFont = new Font(base, 9);
            Font sectionFont = new Font(bold, 12);
            Font headerFont = new Font(bold, 9, Font.NORMAL, java.awt.Color.WHITE);
            Font cellFont = new Font(base, 9);
            Font boldCellFont = new Font(bold, 9);

            Paragraph title = new Paragraph(labels.title(), titleFont);
            title.setSpacingAfter(4);
            document.add(title);

            String period = year != null && month != null
                    ? YearMonth.of(year, month).format(
                    DateTimeFormatter.ofPattern("MMMM yyyy", labels.locale()))
                    : labels.allTime();
            Paragraph meta = new Paragraph(
                    (companyName != null ? companyName + " · " : "") + scopeName + " · " + period,
                    metaFont);
            meta.setSpacingAfter(14);
            document.add(meta);

            for (long userId : sortedUserIds(rows, names)) {
                List<TimeWorkedResponse> userRows = rowsForUser(rows, userId);
                if (userRows.isEmpty()) continue;

                String name = names.getOrDefault(userId, "User " + userId);
                Duration totalWorked = userRows.stream()
                        .map(r -> Duration.ofSeconds(toSeconds(r.worked())))
                        .reduce(Duration.ZERO, Duration::plus);

                Paragraph section = new Paragraph(name, sectionFont);
                section.setSpacingBefore(10);
                section.setSpacingAfter(6);
                document.add(section);

                PdfPTable table = new PdfPTable(new float[]{2, 2, 4});
                table.setWidthPercentage(100);

                table.addCell(headerCell(labels.date(), headerFont));
                table.addCell(headerCell(labels.worked(), headerFont));
                table.addCell(headerCell(labels.projects(), headerFont));

                for (TimeWorkedResponse row : userRows) {
                    table.addCell(bodyCell(row.date().toString(), cellFont, Element.ALIGN_LEFT));
                    table.addCell(bodyCell(formatDuration(row.worked()), cellFont, Element.ALIGN_RIGHT));
                    table.addCell(bodyCell(String.join(", ", row.projects() == null ? List.of() : row.projects()),
                            cellFont, Element.ALIGN_LEFT));
                }

                table.addCell(bodyCell(labels.total(), boldCellFont, Element.ALIGN_LEFT));
                table.addCell(bodyCell(formatDuration(totalWorked), boldCellFont, Element.ALIGN_RIGHT));
                table.addCell(bodyCell("", boldCellFont, Element.ALIGN_LEFT));

                document.add(table);
            }

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            if (document.isOpen()) {
                document.close();
            }
            throw new IllegalStateException("Failed to generate the PDF export", e);
        }
    }

    private static PdfPCell headerCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(new java.awt.Color(51, 65, 85));
        cell.setBorderColor(new java.awt.Color(51, 65, 85));
        cell.setPadding(6);
        return cell;
    }

    private static PdfPCell bodyCell(String text, Font font, int alignment) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setHorizontalAlignment(alignment);
        cell.setPadding(5);
        cell.setBorderColor(new java.awt.Color(226, 232, 240));
        return cell;
    }

    private static List<Long> sortedUserIds(List<TimeWorkedResponse> rows, Map<Long, String> names) {
        List<Long> ids = new ArrayList<>(rows.stream().map(TimeWorkedResponse::userId).distinct().toList());
        ids.sort(Comparator.comparing(id -> names.getOrDefault(id, "User " + id)));
        return ids;
    }
}
