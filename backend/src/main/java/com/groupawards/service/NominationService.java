package com.groupawards.service;

import com.groupawards.dto.NominationDtos.*;
import com.groupawards.entity.AppUser;
import com.groupawards.entity.Nomination;
import com.groupawards.entity.Nominee;
import com.groupawards.entity.Vote;
import com.groupawards.repository.AppUserRepository;
import com.groupawards.repository.NominationRepository;
import com.groupawards.repository.VoteRepository;
import com.groupawards.util.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NominationService {

    private final NominationRepository nominationRepository;
    private final VoteRepository voteRepository;
    private final AppUserRepository appUserRepository;
    private final NomineeService nomineeService;
    private final SettingsService settingsService;

    @Transactional(readOnly = true)
    public List<NominationCard> listForUser(Long userId) {
        Map<Long, Long> myVotes = voteRepository.findByUserId(userId).stream()
                .collect(Collectors.toMap(v -> v.getNomination().getId(), v -> v.getNominee().getId()));

        boolean votingOpen = settingsService.get().isVotingOpen();

        return nominationRepository.findAllWithNomineesOrdered().stream()
                .map(n -> toCard(n, myVotes.get(n.getId()), votingOpen))
                .toList();
    }

    @Transactional(readOnly = true)
    public NominationCard getForUser(Long id, Long userId) {
        Nomination n = nominationRepository.findByIdWithNominees(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Nomination not found"));
        Long myVote = voteRepository.findByUserIdAndNominationId(userId, id)
                .map(v -> v.getNominee().getId())
                .orElse(null);
        return toCard(n, myVote, settingsService.get().isVotingOpen());
    }

    @Transactional
    public NominationCard create(String title, String description, MultipartFile image, List<Long> nomineeIds) {
        Nomination nomination = Nomination.builder()
                .title(title.trim())
                .description(description != null ? description.trim() : "")
                .build();
        applyImage(nomination, image);
        attachNominees(nomination, nomineeIds);
        nomination = nominationRepository.save(nomination);
        return toCard(nominationRepository.findByIdWithNominees(nomination.getId()).orElse(nomination), null, true);
    }

    @Transactional
    public NominationCard update(Long id, String title, String description, MultipartFile image, List<Long> nomineeIds) {
        Nomination nomination = nominationRepository.findByIdWithNominees(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Nomination not found"));
        if (title != null && !title.isBlank()) {
            nomination.setTitle(title.trim());
        }
        if (description != null) {
            nomination.setDescription(description.trim());
        }
        if (image != null && !image.isEmpty()) {
            applyImage(nomination, image);
        }
        if (nomineeIds != null) {
            attachNominees(nomination, nomineeIds);
        }
        nominationRepository.save(nomination);
        return toCard(nomination, null, settingsService.get().isVotingOpen());
    }

    @Transactional
    public void delete(Long id) {
        if (!nominationRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Nomination not found");
        }
        voteRepository.deleteByNominationId(id);
        nominationRepository.deleteById(id);
    }

    @Transactional
    public void castVote(Long userId, VoteRequest request) {
        settingsService.requireVotingOpen();
        Nomination nomination = nominationRepository.findByIdWithNominees(request.nominationId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Nomination not found"));

        Nominee nominee = nomination.getNominees().stream()
                .filter(n -> n.getId().equals(request.nomineeId()))
                .findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Nominee is not in this nomination"));

        Optional<Vote> existing = voteRepository.findByUserIdAndNominationId(userId, nomination.getId());
        if (existing.isPresent()) {
            Vote vote = existing.get();
            vote.setNominee(nominee);
            voteRepository.save(vote);
        } else {
            AppUser user = appUserRepository.findById(userId)
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
            Vote vote = Vote.builder()
                    .user(user)
                    .nomination(nomination)
                    .nominee(nominee)
                    .build();
            voteRepository.save(vote);
        }
    }

    @Transactional(readOnly = true)
    public List<NominationStats> adminStats() {
        boolean closed = !settingsService.get().isVotingOpen();
        return nominationRepository.findAllWithNomineesOrdered().stream()
                .map(n -> buildStats(n, closed))
                .toList();
    }

    @Transactional(readOnly = true)
    public NominationStats adminNominationStats(Long id) {
        Nomination n = nominationRepository.findByIdWithNominees(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Nomination not found"));
        return buildStats(n, !settingsService.get().isVotingOpen());
    }

    @Transactional
    public NominationStats resolveTie(Long nominationId, Long nomineeId) {
        if (settingsService.get().isVotingOpen()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Resolve ties only after voting ends");
        }
        Nomination nomination = nominationRepository.findByIdWithNominees(nominationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Nomination not found"));

        Nominee nominee = nomination.getNominees().stream()
                .filter(n -> n.getId().equals(nomineeId))
                .findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Nominee is not in this nomination"));

        NominationStats stats = buildStats(nomination, true);
        if (!stats.hasTie()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "No tie to resolve");
        }
        boolean isLeader = stats.leaders().stream().anyMatch(l -> l.nomineeId().equals(nomineeId));
        if (!isLeader) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Selected nominee is not among tied leaders");
        }

        nomination.setWinner(nominee);
        nominationRepository.save(nomination);
        return buildStats(nomination, true);
    }

    @Transactional(readOnly = true)
    public byte[] getImage(Long id) {
        Nomination n = nominationRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Nomination not found"));
        if (n.getImageData() == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Image not found");
        }
        return n.getImageData();
    }

    @Transactional(readOnly = true)
    public String getImageContentType(Long id) {
        return nominationRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Nomination not found"))
                .getImageContentType();
    }

    private NominationStats buildStats(Nomination n, boolean includeBreakdown) {
        long total = voteRepository.countByNominationId(n.getId());
        List<Object[]> raw = voteRepository.countVotesByNominee(n.getId());
        Map<Long, Long> counts = new HashMap<>();
        for (Object[] row : raw) {
            counts.put((Long) row[0], (Long) row[1]);
        }

        List<NomineeVoteCount> all = n.getNominees().stream()
                .sorted(Comparator.comparing(Nominee::getName, String.CASE_INSENSITIVE_ORDER))
                .map(nom -> new NomineeVoteCount(nom.getId(), nom.getName(), counts.getOrDefault(nom.getId(), 0L)))
                .toList();

        long max = all.stream().mapToLong(NomineeVoteCount::votes).max().orElse(0);
        List<NomineeVoteCount> leaders = all.stream()
                .filter(v -> v.votes() == max && max > 0)
                .toList();

        boolean hasTie = includeBreakdown && leaders.size() > 1 && n.getWinner() == null;
        Long winnerId = n.getWinner() != null
                ? n.getWinner().getId()
                : (includeBreakdown && leaders.size() == 1 ? leaders.getFirst().nomineeId() : null);

        return new NominationStats(
                n.getId(),
                n.getTitle(),
                total,
                hasTie,
                winnerId,
                includeBreakdown ? leaders : List.of(),
                includeBreakdown ? all : List.of()
        );
    }

    private void attachNominees(Nomination nomination, List<Long> nomineeIds) {
        Set<Nominee> set = new HashSet<>();
        if (nomineeIds != null) {
            for (Long id : nomineeIds) {
                set.add(nomineeService.getEntity(id));
            }
        }
        nomination.setNominees(set);
    }

    private void applyImage(Nomination nomination, MultipartFile image) {
        if (image == null || image.isEmpty()) {
            return;
        }
        try {
            nomination.setImageData(image.getBytes());
            nomination.setImageContentType(image.getContentType() != null ? image.getContentType() : "image/jpeg");
        } catch (IOException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Failed to read image");
        }
    }

    private NominationCard toCard(Nomination n, Long myVoteNomineeId, boolean votingOpen) {
        List<NomineeBrief> nominees = n.getNominees().stream()
                .sorted(Comparator.comparing(Nominee::getName, String.CASE_INSENSITIVE_ORDER))
                .map(nom -> new NomineeBrief(
                        nom.getId(),
                        nom.getName(),
                        nom.getImageData() != null ? "/api/media/nominees/" + nom.getId() + "/image" : null
                ))
                .toList();

        Long totalVotes = null;
        // total votes visible to users only as their own context; admin uses stats endpoints
        if (!votingOpen) {
            totalVotes = voteRepository.countByNominationId(n.getId());
        }

        return new NominationCard(
                n.getId(),
                n.getTitle(),
                n.getDescription(),
                n.getImageData() != null ? "/api/media/nominations/" + n.getId() + "/image" : null,
                n.getCreatedAt(),
                nominees,
                myVoteNomineeId,
                totalVotes
        );
    }
}
