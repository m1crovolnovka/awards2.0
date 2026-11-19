package com.groupawards.dto;

import java.time.Instant;
import java.util.List;

public final class NominationDtos {

    private NominationDtos() {
    }

    public record NomineeBrief(
            Long id,
            String name,
            String imageUrl
    ) {
    }

    public record NominationCard(
            Long id,
            String title,
            String description,
            String imageUrl,
            Instant createdAt,
            List<NomineeBrief> nominees,
            Long myVoteNomineeId,
            Long totalVotes
    ) {
    }

    public record VoteRequest(Long nominationId, Long nomineeId) {
    }

    public record VotingStatus(
            boolean votingOpen,
            Instant announcementAt
    ) {
    }

    public record NomineeVoteCount(
            Long nomineeId,
            String name,
            long votes
    ) {
    }

    public record NominationStats(
            Long nominationId,
            String title,
            long totalVotes,
            boolean hasTie,
            Long winnerNomineeId,
            List<NomineeVoteCount> leaders,
            List<NomineeVoteCount> breakdown
    ) {
    }

    public record ResolveTieRequest(Long nomineeId) {
    }

    public record NomineeAdminView(
            Long id,
            String name,
            String reportName,
            String imageUrl
    ) {
    }
}
