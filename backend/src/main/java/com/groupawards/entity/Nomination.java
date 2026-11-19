package com.groupawards.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "nominations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Nomination {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 4000)
    private String description;

    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(columnDefinition = "BYTEA")
    @Basic(fetch = FetchType.LAZY)
    private byte[] imageData;

    private String imageContentType;

    /** Explicit winner when admin resolves a tie (or confirms sole winner). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "winner_nominee_id")
    private Nominee winner;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "nomination_nominees",
            joinColumns = @JoinColumn(name = "nomination_id"),
            inverseJoinColumns = @JoinColumn(name = "nominee_id")
    )
    @Builder.Default
    private Set<Nominee> nominees = new HashSet<>();

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
