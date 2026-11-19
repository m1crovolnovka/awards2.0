package com.groupawards.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "app_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppSettings {

    @Id
    private Long id;

    @Column(nullable = false)
    private boolean votingOpen;

    /** When voting is closed — announcement countdown target. */
    private Instant announcementAt;

    public static AppSettings defaults() {
        return AppSettings.builder()
                .id(1L)
                .votingOpen(true)
                .announcementAt(null)
                .build();
    }
}
