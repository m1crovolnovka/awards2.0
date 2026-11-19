package com.groupawards.repository;

import com.groupawards.entity.Nominee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NomineeRepository extends JpaRepository<Nominee, Long> {
    List<Nominee> findAllByOrderByNameAsc();
}
