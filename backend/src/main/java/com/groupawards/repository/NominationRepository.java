package com.groupawards.repository;

import com.groupawards.entity.Nomination;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface NominationRepository extends JpaRepository<Nomination, Long> {

    List<Nomination> findAllByOrderByCreatedAtAsc();

    @Query("SELECT DISTINCT n FROM Nomination n LEFT JOIN FETCH n.nominees ORDER BY n.createdAt ASC")
    List<Nomination> findAllWithNomineesOrdered();

    @Query("SELECT n FROM Nomination n LEFT JOIN FETCH n.nominees WHERE n.id = :id")
    Optional<Nomination> findByIdWithNominees(Long id);
}
