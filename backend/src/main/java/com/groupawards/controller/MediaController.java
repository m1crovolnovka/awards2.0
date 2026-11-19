package com.groupawards.controller;

import com.groupawards.service.NominationService;
import com.groupawards.service.NomineeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/media")
@RequiredArgsConstructor
public class MediaController {

    private final NominationService nominationService;
    private final NomineeService nomineeService;

    @GetMapping("/nominations/{id}/image")
    public ResponseEntity<byte[]> nominationImage(@PathVariable Long id) {
        byte[] data = nominationService.getImage(id);
        String type = nominationService.getImageContentType(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "private, max-age=3600")
                .contentType(MediaType.parseMediaType(type != null ? type : "image/jpeg"))
                .body(data);
    }

    @GetMapping("/nominees/{id}/image")
    public ResponseEntity<byte[]> nomineeImage(@PathVariable Long id) {
        byte[] data = nomineeService.getImage(id);
        String type = nomineeService.getImageContentType(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "private, max-age=3600")
                .contentType(MediaType.parseMediaType(type != null ? type : "image/jpeg"))
                .body(data);
    }
}
