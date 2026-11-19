package com.groupawards.service;

import com.groupawards.dto.NominationDtos.NominationStats;
import com.groupawards.dto.NominationDtos.NomineeVoteCount;
import com.groupawards.entity.Nomination;
import com.groupawards.entity.Nominee;
import com.groupawards.repository.NominationRepository;
import com.groupawards.util.ApiException;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final NominationRepository nominationRepository;
    private final NominationService nominationService;
    private final SettingsService settingsService;

    @Transactional(readOnly = true)
    public byte[] winnersReport() {
        requireClosed();
        List<Nomination> nominations = nominationRepository.findAllWithNomineesOrdered();
        List<NominationStats> stats = nominationService.adminStats();

        try (PDDocument doc = new PDDocument(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PDType0Font font = loadFont(doc);
            PDType0Font fontBold = loadFontBold(doc);

            for (Nomination nomination : nominations) {
                NominationStats st = stats.stream()
                        .filter(s -> s.nominationId().equals(nomination.getId()))
                        .findFirst()
                        .orElse(null);

                String winnerReportName = resolveWinnerReportName(nomination, st);

                PDPage page = new PDPage(PDRectangle.A4);
                doc.addPage(page);
                try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                    float y = page.getMediaBox().getHeight() - 80;

                    cs.beginText();
                    cs.setFont(fontBold, 22);
                    cs.newLineAtOffset(60, y);
                    cs.showText(sanitize("Номинация"));
                    cs.endText();

                    y -= 40;
                    for (String line : wrap(nomination.getTitle(), 40)) {
                        cs.beginText();
                        cs.setFont(fontBold, 18);
                        cs.newLineAtOffset(60, y);
                        cs.showText(sanitize(line));
                        cs.endText();
                        y -= 26;
                    }

                    y -= 30;
                    cs.beginText();
                    cs.setFont(font, 14);
                    cs.newLineAtOffset(60, y);
                    cs.showText(sanitize("Победитель:"));
                    cs.endText();

                    y -= 36;
                    cs.beginText();
                    cs.setFont(fontBold, 20);
                    cs.newLineAtOffset(60, y);
                    cs.showText(sanitize(winnerReportName != null ? winnerReportName : "— не определён —"));
                    cs.endText();
                }
            }

            doc.save(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to build winners PDF");
        }
    }

    @Transactional(readOnly = true)
    public byte[] detailedVotesReport() {
        requireClosed();
        List<NominationStats> stats = nominationService.adminStats();

        try (PDDocument doc = new PDDocument(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PDType0Font font = loadFont(doc);
            PDType0Font fontBold = loadFontBold(doc);

            for (NominationStats st : stats) {
                PDPage page = new PDPage(PDRectangle.A4);
                doc.addPage(page);
                try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                    float y = page.getMediaBox().getHeight() - 70;

                    cs.beginText();
                    cs.setFont(fontBold, 18);
                    cs.newLineAtOffset(50, y);
                    cs.showText(sanitize(st.title()));
                    cs.endText();

                    y -= 28;
                    cs.beginText();
                    cs.setFont(font, 12);
                    cs.newLineAtOffset(50, y);
                    cs.showText(sanitize("Всего голосов: " + st.totalVotes()));
                    cs.endText();

                    y -= 36;
                    for (NomineeVoteCount row : st.breakdown()) {
                        if (y < 60) {
                            break;
                        }
                        cs.beginText();
                        cs.setFont(font, 12);
                        cs.newLineAtOffset(50, y);
                        cs.showText(sanitize(row.name() + " — " + row.votes()));
                        cs.endText();
                        y -= 20;
                    }
                }
            }

            doc.save(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to build detailed PDF");
        }
    }

    private String resolveWinnerReportName(Nomination nomination, NominationStats st) {
        if (nomination.getWinner() != null) {
            return nomination.getWinner().getReportName();
        }
        if (st != null && st.winnerNomineeId() != null) {
            return nomination.getNominees().stream()
                    .filter(n -> n.getId().equals(st.winnerNomineeId()))
                    .map(Nominee::getReportName)
                    .findFirst()
                    .orElse(null);
        }
        return null;
    }

    private void requireClosed() {
        if (settingsService.get().isVotingOpen()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Reports are available after voting ends");
        }
    }

    private PDType0Font loadFont(PDDocument doc) throws IOException {
        try (InputStream in = new ClassPathResource("fonts/DejaVuSans.ttf").getInputStream()) {
            return PDType0Font.load(doc, in);
        }
    }

    private PDType0Font loadFontBold(PDDocument doc) throws IOException {
        try (InputStream in = new ClassPathResource("fonts/DejaVuSans-Bold.ttf").getInputStream()) {
            return PDType0Font.load(doc, in);
        }
    }

    private static String sanitize(String text) {
        if (text == null) {
            return "";
        }
        return text.replace("\t", " ").replace("\r", " ").replace("\n", " ");
    }

    private static List<String> wrap(String text, int max) {
        if (text == null || text.isBlank()) {
            return List.of("");
        }
        String[] words = text.split("\\s+");
        StringBuilder line = new StringBuilder();
        java.util.ArrayList<String> lines = new java.util.ArrayList<>();
        for (String w : words) {
            if (line.length() + w.length() + 1 > max) {
                lines.add(line.toString());
                line = new StringBuilder(w);
            } else {
                if (!line.isEmpty()) {
                    line.append(' ');
                }
                line.append(w);
            }
        }
        if (!line.isEmpty()) {
            lines.add(line.toString());
        }
        return lines;
    }
}
