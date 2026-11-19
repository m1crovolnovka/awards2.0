package com.groupawards.controller;

import com.groupawards.dto.NominationDtos.*;
import com.groupawards.service.NominationService;
import com.groupawards.service.NomineeService;
import com.groupawards.service.ReportService;
import com.groupawards.service.SettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final NominationService nominationService;
    private final NomineeService nomineeService;
    private final SettingsService settingsService;
    private final ReportService reportService;

    @GetMapping("/voting-status")
    public VotingStatus votingStatus() {
        return settingsService.status();
    }

    @PostMapping("/voting/end")
    public VotingStatus endVoting(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant announcementAt
    ) {
        return settingsService.endVoting(announcementAt);
    }

    @PostMapping("/voting/resume")
    public VotingStatus resumeVoting() {
        return settingsService.resumeVoting();
    }

    @GetMapping("/nominees")
    public List<NomineeAdminView> nominees() {
        return nomineeService.listAll();
    }

    @PostMapping(value = "/nominees", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public NomineeAdminView createNominee(
            @RequestParam String name,
            @RequestParam String reportName,
            @RequestParam(required = false) MultipartFile image
    ) {
        return nomineeService.create(name, reportName, image);
    }

    @PutMapping(value = "/nominees/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public NomineeAdminView updateNominee(
            @PathVariable Long id,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String reportName,
            @RequestParam(required = false) MultipartFile image
    ) {
        return nomineeService.update(id, name, reportName, image);
    }

    @DeleteMapping("/nominees/{id}")
    public void deleteNominee(@PathVariable Long id) {
        nomineeService.delete(id);
    }

    @GetMapping("/nominations")
    public List<NominationCard> nominations() {
        return nominationService.listForUser(nullSafeAdminList());
    }

    @PostMapping(value = "/nominations", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public NominationCard createNomination(
            @RequestParam String title,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) MultipartFile image,
            @RequestParam(required = false) String nomineeIds
    ) {
        return nominationService.create(title, description, image, parseIds(nomineeIds));
    }

    @PutMapping(value = "/nominations/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public NominationCard updateNomination(
            @PathVariable Long id,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) MultipartFile image,
            @RequestParam(required = false) String nomineeIds
    ) {
        return nominationService.update(id, title, description, image, parseIds(nomineeIds));
    }

    @DeleteMapping("/nominations/{id}")
    public void deleteNomination(@PathVariable Long id) {
        nominationService.delete(id);
    }

    @GetMapping("/stats")
    public List<NominationStats> stats() {
        return nominationService.adminStats();
    }

    @GetMapping("/stats/{nominationId}")
    public NominationStats nominationStats(@PathVariable Long nominationId) {
        return nominationService.adminNominationStats(nominationId);
    }

    @PostMapping("/ties/{nominationId}/resolve")
    public NominationStats resolveTie(
            @PathVariable Long nominationId,
            @RequestBody ResolveTieRequest request
    ) {
        return nominationService.resolveTie(nominationId, request.nomineeId());
    }

    @GetMapping("/reports/winners")
    public ResponseEntity<byte[]> winnersReport() {
        byte[] pdf = reportService.winnersReport();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=winners.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @GetMapping("/reports/detailed")
    public ResponseEntity<byte[]> detailedReport() {
        byte[] pdf = reportService.detailedVotesReport();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=votes-detailed.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    private Long nullSafeAdminList() {
        // Admin list uses same card mapping without personal votes
        return -1L;
    }

    private List<Long> parseIds(String raw) {
        if (raw == null || raw.isBlank()) {
            return List.of();
        }
        return Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(Long::valueOf)
                .toList();
    }
}
