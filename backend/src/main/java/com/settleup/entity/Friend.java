package com.settleup.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity @Table(name = "friends", indexes = @Index(columnList = "owner_id")) @Getter @Setter @NoArgsConstructor
public class Friend {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) private User owner;
    @Column(nullable = false, length = 80) private String name;
    @Column(length = 160) private String email;
    /** Soft delete: removing a friend keeps settled debt history readable. */
    @Column(nullable = false) private boolean active = true;
}
