package com.groupawards.service;

import com.groupawards.dto.NominationDtos.VotingStatus;
import com.groupawards.entity.AppSettings;
import com.groupawards.repository.AppSettingsRepository;
import com.groupawards.util.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class SettingsService {

    private final AppSettingsRepository settingsRepository;

    @Transactional(readOnly = true)
    public AppSettings get() {
        return settingsRepository.findById(1L)
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Settings missing"));
    }

    @Transactional(readOnly = true)
    public VotingStatus status() {
        AppSettings s = get();
        return new VotingStatus(s.isVotingOpen(), s.getAnnouncementAt());
    }

    @Transactional
    public VotingStatus endVoting(Instant announcementAt) {
        AppSettings s = get();
        s.setVotingOpen(false);
        s.setAnnouncementAt(announcementAt != null
                ? announcementAt
                : Instant.now().plus(1, ChronoUnit.HOURS));
        settingsRepository.save(s);
        return status();
    }

    @Transactional
    public VotingStatus resumeVoting() {
        AppSettings s = get();
        s.setVotingOpen(true);
        s.setAnnouncementAt(null);
        settingsRepository.save(s);
        return status();
    }

    @Transactional(readOnly = true)
    public void requireVotingOpen() {
        if (!get().isVotingOpen()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Voting is closed");
        }
    }
}
