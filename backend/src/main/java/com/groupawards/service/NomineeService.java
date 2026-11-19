package com.groupawards.service;

import com.groupawards.dto.NominationDtos.NomineeAdminView;
import com.groupawards.entity.Nominee;
import com.groupawards.repository.NomineeRepository;
import com.groupawards.util.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NomineeService {

    private final NomineeRepository nomineeRepository;

    @Transactional(readOnly = true)
    public List<NomineeAdminView> listAll() {
        return nomineeRepository.findAllByOrderByNameAsc().stream()
                .map(this::toAdminView)
                .toList();
    }

    @Transactional
    public NomineeAdminView create(String name, String reportName, MultipartFile image) {
        Nominee nominee = Nominee.builder()
                .name(name.trim())
                .reportName(reportName.trim())
                .build();
        applyImage(nominee, image);
        return toAdminView(nomineeRepository.save(nominee));
    }

    @Transactional
    public NomineeAdminView update(Long id, String name, String reportName, MultipartFile image) {
        Nominee nominee = nomineeRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Nominee not found"));
        if (name != null && !name.isBlank()) {
            nominee.setName(name.trim());
        }
        if (reportName != null && !reportName.isBlank()) {
            nominee.setReportName(reportName.trim());
        }
        if (image != null && !image.isEmpty()) {
            applyImage(nominee, image);
        }
        return toAdminView(nomineeRepository.save(nominee));
    }

    @Transactional
    public void delete(Long id) {
        if (!nomineeRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Nominee not found");
        }
        nomineeRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public Nominee getEntity(Long id) {
        return nomineeRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Nominee not found"));
    }

    @Transactional(readOnly = true)
    public byte[] getImage(Long id) {
        Nominee n = getEntity(id);
        if (n.getImageData() == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Image not found");
        }
        return n.getImageData();
    }

    @Transactional(readOnly = true)
    public String getImageContentType(Long id) {
        return getEntity(id).getImageContentType();
    }

    private void applyImage(Nominee nominee, MultipartFile image) {
        if (image == null || image.isEmpty()) {
            return;
        }
        try {
            nominee.setImageData(image.getBytes());
            nominee.setImageContentType(image.getContentType() != null ? image.getContentType() : "image/jpeg");
        } catch (IOException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Failed to read image");
        }
    }

    private NomineeAdminView toAdminView(Nominee n) {
        return new NomineeAdminView(
                n.getId(),
                n.getName(),
                n.getReportName(),
                n.getImageData() != null ? "/api/media/nominees/" + n.getId() + "/image" : null
        );
    }
}
