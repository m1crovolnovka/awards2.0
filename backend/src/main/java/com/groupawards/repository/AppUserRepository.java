package com.groupawards.repository;

import com.groupawards.entity.AppUser;
import com.groupawards.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {
    Optional<AppUser> findByTelegramId(Long telegramId);
    Optional<AppUser> findByAdminLogin(String adminLogin);
    boolean existsByRole(Role role);
}
