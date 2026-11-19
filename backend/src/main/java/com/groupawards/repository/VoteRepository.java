package com.groupawards.repository;

import com.groupawards.entity.Vote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface VoteRepository extends JpaRepository<Vote, Long> {

    Optional<Vote> findByUserIdAndNominationId(Long userId, Long nominationId);

    List<Vote> findByUserId(Long userId);

    long countByNominationId(Long nominationId);

    @Query("""
            SELECT v.nominee.id, COUNT(v)
            FROM Vote v
            WHERE v.nomination.id = :nominationId
            GROUP BY v.nominee.id
            """)
    List<Object[]> countVotesByNominee(Long nominationId);

    boolean existsByNominationIdAndNomineeId(Long nominationId, Long nomineeId);

    void deleteByNominationId(Long nominationId);
}
