package com.settleup.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** One debt record. Money is stored as whole paise (long); repayments live in Payment and never change amountPaise. */
@Entity @Table(name = "debts", indexes = @Index(columnList = "owner_id")) @Getter @Setter @NoArgsConstructor
public class Debt {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) private User owner;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) private Friend friend;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 10) private Direction direction;
    @Column(nullable = false) private long amountPaise;
    @Column(nullable = false, length = 120) private String description;
    @Column(name = "transaction_date", nullable = false) private LocalDate date;
    private LocalDate dueDate;
    @Column(length = 500) private String notes;
}
